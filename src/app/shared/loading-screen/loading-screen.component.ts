import { Component, inject } from '@angular/core';
import { AppInitService } from '../../core/services/app-init.service';

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
}

@Component({
    selector: 'app-loading-screen',
    standalone: true,
    template: `
        <div class="ls" [class.ls--out]="initService.isFading()">

            <!-- Ambient background orbs -->
            <div class="orb orb-1"></div>
            <div class="orb orb-2"></div>
            <div class="orb orb-3"></div>

            <!-- Dot-grid texture -->
            <div class="dot-grid"></div>

            <!-- Floating particles -->
            @for (p of particles; track p.id) {
                <div
                    class="particle"
                    [style.left]="p.x + '%'"
                    [style.top]="p.y + '%'"
                    [style.width]="p.size + 'px'"
                    [style.height]="p.size + 'px'"
                    [style.animation-delay]="p.delay + 's'"
                    [style.animation-duration]="p.duration + 's'"
                ></div>
            }

            <!-- ── Main content ── -->
            <div class="content">

                <!-- Concentric spinner rings + brand centre -->
                <div class="rings-wrap">
                    <div class="ring ring-a"></div>
                    <div class="ring ring-b"></div>
                    <div class="ring ring-c"></div>

                    <!-- Brand text lives inside the inner disc -->
                    <div class="brand-center">
                        <div class="brand-initials">
                            <span class="bl bl-1">W</span>
                            <span class="bl bl-2">E</span>
                            <span class="bl bl-3">S</span>
                        </div>
                    </div>
                </div>

                <!-- Name -->
                <div class="titles">
                    <h1 class="brand-name">WES</h1>
                </div>

                <!-- Progress bar -->
                <div class="progress-area">
                    <div class="progress-track">
                        <div class="progress-fill" [style.width]="initService.progress() + '%'">
                            <div class="progress-shine"></div>
                        </div>
                    </div>
                    <div class="progress-meta">
                        <span class="prog-status">{{ initService.statusText() }}</span>
                        <span class="prog-pct">{{ initService.progress() }}%</span>
                    </div>
                </div>

            </div>
        </div>
    `,
    styles: [`
        :host { display: block; }

        /* ── Overlay ── */
        .ls {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(145deg, #060614 0%, #0c0d38 45%, #1a1b62 80%, #2d2e83 100%);
            overflow: hidden;
            opacity: 1;
            transition: opacity 0.75s ease;
        }

        .ls.ls--out {
            opacity: 0;
            pointer-events: none;
        }

        /* ── Ambient orbs ── */
        .orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            pointer-events: none;
            animation: floatOrb 10s ease-in-out infinite;
        }

        .orb-1 {
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(45, 46, 131, 0.65) 0%, transparent 70%);
            top: -160px;
            left: -120px;
            animation-delay: 0s;
        }

        .orb-2 {
            width: 380px;
            height: 380px;
            background: radial-gradient(circle, rgba(69, 68, 231, 0.55) 0%, transparent 70%);
            bottom: -110px;
            right: -90px;
            animation-delay: -4s;
        }

        .orb-3 {
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(124, 122, 184, 0.45) 0%, transparent 70%);
            top: 35%;
            left: 62%;
            animation-delay: -7.5s;
        }

        @keyframes floatOrb {
            0%, 100% { transform: translateY(0) scale(1);    opacity: 0.45; }
            50%       { transform: translateY(-45px) scale(1.1); opacity: 0.65; }
        }

        /* ── Dot-grid texture ── */
        .dot-grid {
            position: absolute;
            inset: 0;
            background-image: radial-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px);
            background-size: 38px 38px;
            pointer-events: none;
        }

        /* ── Floating particles ── */
        .particle {
            position: absolute;
            border-radius: 50%;
            background: rgba(124, 122, 184, 0.45);
            animation: floatUp linear infinite;
            pointer-events: none;
        }

        @keyframes floatUp {
            0%   { transform: translateY(0);      opacity: 0;   }
            15%  { opacity: 0.7; }
            85%  { opacity: 0.25; }
            100% { transform: translateY(-100px); opacity: 0;   }
        }

        /* ── Content card ── */
        .content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.8rem;
            z-index: 1;
            animation: contentReveal 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes contentReveal {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0);    }
        }

        /* ── Spinner rings ── */
        .rings-wrap {
            position: relative;
            width: 196px;
            height: 196px;
        }

        .ring {
            position: absolute;
            border-radius: 50%;
        }

        /* Outer ring – thin arc segment, slow CW */
        .ring-a {
            inset: 0;
            border: 2.5px solid transparent;
            border-top-color: #7C7AB8;
            border-right-color: rgba(124, 122, 184, 0.2);
            animation: spinCW 2.6s linear infinite;
        }

        /* Middle ring – dashed, CCW */
        .ring-b {
            inset: 24px;
            border: 2px solid transparent;
            border-top-color: #4544e7;
            border-left-color: rgba(69, 68, 231, 0.28);
            animation: spinCCW 3.8s linear infinite;
        }

        /* Inner glowing disc */
        .ring-c {
            inset: 50px;
            border: 1.5px solid rgba(255, 255, 255, 0.07);
            background: radial-gradient(circle, rgba(69, 68, 231, 0.28) 0%, rgba(45, 46, 131, 0.18) 100%);
            box-shadow:
                0 0 28px rgba(69, 68, 231, 0.55),
                inset 0 0 18px rgba(69, 68, 231, 0.22);
            animation: discPulse 2.2s ease-in-out infinite;
        }

        @keyframes spinCW  { to { transform: rotate(360deg);  } }
        @keyframes spinCCW { to { transform: rotate(-360deg); } }

        @keyframes discPulse {
            0%, 100% {
                box-shadow: 0 0 28px rgba(69, 68, 231, 0.55), inset 0 0 18px rgba(69, 68, 231, 0.22);
            }
            50% {
                box-shadow: 0 0 48px rgba(69, 68, 231, 0.85), inset 0 0 28px rgba(69, 68, 231, 0.42);
            }
        }

        /* ── Brand centre ── */
        .brand-center {
            position: absolute;
            inset: 50px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
        }

        .brand-initials {
            display: flex;
            gap: 1px;
        }

        .bl {
            display: inline-block;
            font-size: 1.45rem;
            font-weight: 800;
            color: #fff;
            text-shadow:
                0 0 14px rgba(124, 122, 184, 0.95),
                0 0 32px rgba(69, 68, 231, 0.65);
            opacity: 0;
            animation: letterPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .bl-1 { animation-delay: 0.35s; }
        .bl-2 { animation-delay: 0.5s;  }
        .bl-3 { animation-delay: 0.65s; }

        @keyframes letterPop {
            from { opacity: 0; transform: scale(0.4) rotate(-15deg); }
            to   { opacity: 1; transform: scale(1)   rotate(0deg);   }
        }


        /* ── Titles ── */
        .titles {
            text-align: center;
        }

        .brand-name {
            margin: 0 0 0.4rem;
            color: #fff;
            font-size: 1.45rem;
            font-weight: 600;
            letter-spacing: 0.04em;
        }


        /* ── Progress ── */
        .progress-area {
            width: 270px;
        }

        .progress-track {
            height: 4px;
            background: rgba(255, 255, 255, 0.09);
            border-radius: 99px;
            overflow: hidden;
            margin-bottom: 0.6rem;
        }

        .progress-fill {
            height: 100%;
            min-width: 4px;
            background: linear-gradient(90deg, #2D2E83, #4544e7, #7C7AB8);
            border-radius: 99px;
            transition: width 0.65s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .progress-shine {
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%);
            animation: progressShine 1.8s ease-in-out infinite;
        }

        @keyframes progressShine {
            from { transform: translateX(-150%); }
            to   { transform: translateX(350%);  }
        }

        .progress-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
        }

        .prog-status {
            color: rgba(255, 255, 255, 0.42);
            font-size: 0.72rem;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: color 0.3s ease;
        }

        .prog-pct {
            color: rgba(255, 255, 255, 0.72);
            font-size: 0.8rem;
            font-weight: 600;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
    `]
})
export class LoadingScreenComponent {
    protected readonly initService = inject(AppInitService);

    protected readonly particles: Particle[] = [
        { id: 0,  x: 8,  y: 82, size: 4,  delay: 0,   duration: 5.5 },
        { id: 1,  x: 22, y: 65, size: 6,  delay: 1.3, duration: 7.2 },
        { id: 2,  x: 38, y: 88, size: 3,  delay: 0.6, duration: 6.0 },
        { id: 3,  x: 52, y: 72, size: 5,  delay: 2.2, duration: 5.8 },
        { id: 4,  x: 67, y: 85, size: 4,  delay: 0.9, duration: 6.8 },
        { id: 5,  x: 83, y: 68, size: 6,  delay: 1.7, duration: 5.3 },
        { id: 6,  x: 14, y: 33, size: 3,  delay: 3.1, duration: 7.0 },
        { id: 7,  x: 91, y: 22, size: 5,  delay: 0.4, duration: 6.4 },
        { id: 8,  x: 58, y: 42, size: 4,  delay: 2.6, duration: 5.1 },
        { id: 9,  x: 33, y: 18, size: 3,  delay: 1.9, duration: 6.6 },
        { id: 10, x: 76, y: 48, size: 5,  delay: 0.7, duration: 7.5 },
        { id: 11, x: 45, y: 55, size: 4,  delay: 3.8, duration: 5.9 },
    ];
}
