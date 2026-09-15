import React, { useEffect, useRef } from 'react';

interface PixelLifeBackgroundProps {
  /** 内部逻辑网格宽度（越小像素颗粒越大，越大颗粒越细腻），推荐 140~200 */
  gridWidth?: number;
  /** 演算步频 (FPS)，可动态高速运算，推荐 24~60 */
  fps?: number;
  /** 初始活细胞密度 (0.08 ~ 0.2) */
  density?: number;
  /** 整体不透明度 (0.1 ~ 0.8) */
  opacity?: number;
  /** 外部主动注入扰动脉冲触发计数器 */
  seedTrigger?: number;
}

export const PixelLifeBackground: React.FC<PixelLifeBackgroundProps> = ({
  gridWidth = 160,
  fps = 30,
  density = 0.16,
  opacity = 0.26,
  seedTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fpsRef = useRef(fps);
  const triggerInjectRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fpsRef.current = fps;
  }, [fps]);

  useEffect(() => {
    if (seedTrigger !== undefined && triggerInjectRef.current) {
      triggerInjectRef.current();
    }
  }, [seedTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let isHidden = false;
    let lastTime = performance.now();

    // 1. 计算适应视口的极低逻辑分辨率 (GPU 硬件最近邻无损放大)
    const calcDimensions = () => {
      const w = gridWidth;
      const aspect = window.innerHeight / (window.innerWidth || 1);
      const h = Math.max(30, Math.floor(w * aspect));
      return { w, h, size: w * h };
    };

    let { w, h, size } = calcDimensions();
    canvas.width = w;
    canvas.height = h;

    // 2. 双缓冲零 GC Uint8Array (0 = 死亡, 1 = 成熟活细胞, 2 = 新生细胞)
    let current = new Uint8Array(size);
    let next = new Uint8Array(size);
    // 连续停留步数记录器 (用于检测不动不生成的静止废弃像素并在超时后自发老化消解)
    let cellAge = new Uint16Array(size);

    // 初始生命随机播种
    for (let i = 0; i < size; i++) {
      const isAlive = Math.random() < density;
      current[i] = isAlive ? (Math.random() < 0.4 ? 2 : 1) : 0;
      cellAge[i] = isAlive ? 1 : 0;
    }

    let imgData = ctx.createImageData(w, h);
    let buf32 = new Uint32Array(imgData.data.buffer);

    // 32-bit RGBA 颜色定义 (小端序: AABBGGRR)
    // 低调幽暗灰蓝调像素：成熟细胞为质感石板灰 (#5A697E)，新生细胞为稍亮冷银 (#7A8C9E)
    // 衰老渐隐色：停滞不动即将消亡的静态细胞呈现深墨冷灰 (#343E4B)，平滑蒸发
    const COLOR_DEAD = 0x00000000;
    const COLOR_MATURE = (245 << 24) | (126 << 16) | (105 << 8) | 90; // #5A697E 质感石板灰
    const COLOR_NEWBORN = (255 << 24) | (158 << 16) | (140 << 8) | 122; // #7A8C9E 冷银微亮灰
    const COLOR_AGING = (150 << 24) | (75 << 16) | (62 << 8) | 52; // #343E4B 渐隐衰老暗灰

    // 注入滑翔机 (Glider) 等生命活力种子
    const injectGlider = (grid: Uint8Array, startX: number, startY: number) => {
      const glider = [
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 1],
      ];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const x = (startX + c + w) % w;
          const y = (startY + r + h) % h;
          const idx = y * w + x;
          if (glider[r][c]) {
            grid[idx] = 2;
            cellAge[idx] = 1;
          }
        }
      }
    };

    // 暴露外部手动扰动/播种函数
    triggerInjectRef.current = () => {
      for (let g = 0; g < 4; g++) {
        const gx = Math.floor(Math.random() * (w - 10));
        const gy = Math.floor(Math.random() * (h - 10));
        injectGlider(current, gx, gy);
      }
      for (let k = 0; k < 60; k++) {
        const rx = Math.floor(Math.random() * w);
        const ry = Math.floor(Math.random() * h);
        const idx = ry * w + rx;
        current[idx] = 2;
        cellAge[idx] = 1;
        buf32[idx] = COLOR_NEWBORN;
      }
      ctx.putImageData(imgData, 0, 0);
    };

    // 首屏预注入经典滑翔机并立即绘制第一帧，避免启动空白
    injectGlider(current, Math.floor(w * 0.12), Math.floor(h * 0.2));
    injectGlider(current, Math.floor(w * 0.85), Math.floor(h * 0.3));
    injectGlider(current, Math.floor(w * 0.25), Math.floor(h * 0.75));
    injectGlider(current, Math.floor(w * 0.78), Math.floor(h * 0.7));
    for (let i = 0; i < size; i++) {
      const s = current[i];
      if (s === 2) buf32[i] = COLOR_NEWBORN;
      else if (s === 1) buf32[i] = COLOR_MATURE;
      else buf32[i] = COLOR_DEAD;
    }
    ctx.putImageData(imgData, 0, 0);

    let stepCount = 0;

    // 3. 高性能演化步进循环
    const step = (now: number) => {
      animId = requestAnimationFrame(step);

      if (isHidden) return;

      const activeFps = Math.max(1, fpsRef.current);
      const interval = 1000 / activeFps;
      const elapsed = now - lastTime;
      if (elapsed < interval) return;
      lastTime = now - (elapsed % interval);
      stepCount++;

      // 长期停滞不动且未生成新位移的死水像素，在约 2.6 秒后自发老化消解
      const maxStaticAge = Math.max(25, Math.round(activeFps * 2.6));
      const agingThreshold = Math.round(maxStaticAge * 0.7);

      let liveCount = 0;

      // 快速生命游戏 8 邻域卷积 (使用周期性环形边界 Toroidal wrapping)
      for (let y = 0; y < h; y++) {
        const yTop = ((y - 1 + h) % h) * w;
        const yMid = y * w;
        const yBot = ((y + 1) % h) * w;

        for (let x = 0; x < w; x++) {
          const xLeft = (x - 1 + w) % w;
          const xRight = (x + 1) % w;

          const neighbors =
            (current[yTop + xLeft] ? 1 : 0) +
            (current[yTop + x] ? 1 : 0) +
            (current[yTop + xRight] ? 1 : 0) +
            (current[yMid + xLeft] ? 1 : 0) +
            (current[yMid + xRight] ? 1 : 0) +
            (current[yBot + xLeft] ? 1 : 0) +
            (current[yBot + x] ? 1 : 0) +
            (current[yBot + xRight] ? 1 : 0);

          const idx = yMid + x;
          const cellState = current[idx];

          if (cellState > 0) {
            if (neighbors === 2 || neighbors === 3) {
              const age = cellAge[idx] + 1;
              if (age >= maxStaticAge) {
                // 静态像素达到停滞寿命极限：自然死亡解构
                next[idx] = 0;
                cellAge[idx] = 0;
                buf32[idx] = COLOR_DEAD;
              } else {
                next[idx] = 1; // 存活并转为成熟
                cellAge[idx] = age;
                if (age >= agingThreshold) {
                  buf32[idx] = COLOR_AGING; // 呈现微暗渐隐过渡态
                } else {
                  buf32[idx] = COLOR_MATURE;
                }
                liveCount++;
              }
            } else {
              next[idx] = 0; // 孤立或拥挤死亡
              cellAge[idx] = 0;
              buf32[idx] = COLOR_DEAD;
            }
          } else {
            if (neighbors === 3) {
              next[idx] = 2; // 新生活力细胞
              cellAge[idx] = 1;
              buf32[idx] = COLOR_NEWBORN;
              liveCount++;
            } else {
              next[idx] = 0;
              cellAge[idx] = 0;
              buf32[idx] = COLOR_DEAD;
            }
          }
        }
      }

      // 周期性或种群过低时注入动态活力扰动种子 (防止完全灭绝或静止)
      const injectThreshold = Math.max(30, Math.floor(activeFps * 3));
      if (liveCount < size * 0.03 || stepCount % injectThreshold === 0) {
        const randX = Math.floor(Math.random() * (w - 10));
        const randY = Math.floor(Math.random() * (h - 10));
        injectGlider(next, randX, randY);
        // 轻微散落几颗活细胞
        for (let k = 0; k < 12; k++) {
          const rx = (randX + Math.floor(Math.random() * 8)) % w;
          const ry = (randY + Math.floor(Math.random() * 8)) % h;
          const idx = ry * w + rx;
          next[idx] = 2;
          cellAge[idx] = 1;
          buf32[idx] = COLOR_NEWBORN;
        }
      }

      // 双缓冲区指针交换
      const temp = current;
      current = next;
      next = temp;

      // 批量提交至显存 (微秒级单次写屏)
      ctx.putImageData(imgData, 0, 0);
    };

    // 4. 视口大小自适应监听
    const handleResize = () => {
      const nextDim = calcDimensions();
      if (nextDim.w !== w || nextDim.h !== h) {
        w = nextDim.w;
        h = nextDim.h;
        size = nextDim.size;
        canvas.width = w;
        canvas.height = h;
        current = new Uint8Array(size);
        next = new Uint8Array(size);
        cellAge = new Uint16Array(size);
        for (let i = 0; i < size; i++) {
          const isAlive = Math.random() < density;
          current[i] = isAlive ? (Math.random() < 0.4 ? 2 : 1) : 0;
          cellAge[i] = isAlive ? 1 : 0;
        }
        imgData = ctx.createImageData(w, h);
        buf32 = new Uint32Array(imgData.data.buffer);
      }
    };

    // 5. 标签页休眠无感降耗 (切出时完全不占 CPU)
    const handleVisibility = () => {
      isHidden = document.hidden;
      if (!isHidden) lastTime = performance.now();
    };

    // 6. 鼠标点击/拖拽交互：在光标所在空间注入新像素生命群落
    const spawnLifeAt = (clientX: number, clientY: number, isBurst: boolean) => {
      const rectWidth = window.innerWidth || 1;
      const rectHeight = window.innerHeight || 1;
      const gx = Math.floor((clientX / rectWidth) * w);
      const gy = Math.floor((clientY / rectHeight) * h);

      if (isBurst) {
        // 单击：注入高演化潜能种子结构（R-pentomino / 滑翔机 / 震荡十字）
        const patterns = [
          // R-pentomino (极度活跃，可演化繁衍数百代)
          [
            [0, 1, 1],
            [1, 1, 0],
            [0, 1, 0],
          ],
          // Glider (飞行动力滑翔机)
          [
            [0, 1, 0],
            [0, 0, 1],
            [1, 1, 1],
          ],
          // Cross 震荡星火
          [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0],
          ],
        ];
        const pat = patterns[Math.floor(Math.random() * patterns.length)];
        for (let pr = 0; pr < pat.length; pr++) {
          for (let pc = 0; pc < pat[pr].length; pc++) {
            if (pat[pr][pc]) {
              const px = (gx + pc - 1 + w) % w;
              const py = (gy + pr - 1 + h) % h;
              const idx = py * w + px;
              current[idx] = 2;
              cellAge[idx] = 1;
              buf32[idx] = COLOR_NEWBORN;
            }
          }
        }
        // 四周迸发微型随机像素火花
        for (let s = 0; s < 14; s++) {
          const dx = Math.floor((Math.random() - 0.5) * 10);
          const dy = Math.floor((Math.random() - 0.5) * 10);
          const px = (gx + dx + w) % w;
          const py = (gy + dy + h) % h;
          const idx = py * w + px;
          current[idx] = 2;
          cellAge[idx] = 1;
          buf32[idx] = COLOR_NEWBORN;
        }
      } else {
        // 拖拽涂抹：沿路径播撒活细胞
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (Math.random() < 0.65) {
              const px = (gx + dx + w) % w;
              const py = (gy + dy + h) % h;
              const idx = py * w + px;
              current[idx] = 2;
              cellAge[idx] = 1;
              buf32[idx] = COLOR_NEWBORN;
            }
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 0) {
        spawnLifeAt(e.clientX, e.clientY, true);
      }
    };

    let lastDragTime = 0;
    const handlePointerMove = (e: PointerEvent) => {
      if (e.buttons === 1) {
        const now = performance.now();
        if (now - lastDragTime > 35) {
          lastDragTime = now;
          spawnLifeAt(e.clientX, e.clientY, false);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [gridWidth, density]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 像素生命游戏画布：通过 GPU 硬件临近采样放大 */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{
          imageRendering: 'pixelated',
          opacity,
        }}
      />
      {/* 极简网格微纹理，强化像素科技工业质感 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />
      {/* 柔和暗色径向边缘遮罩：中心通透保真，四周轻微渐隐 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, transparent 45%, rgba(0,0,0,0.32) 100%)',
        }}
      />
    </div>
  );
};
