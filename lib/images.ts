/**
 * Algorithmic Image Generation Library
 * All images are generated from code - no external AI APIs
 */

export interface AlgorithmicImage {
  type: 'ascii' | 'svg' | 'pixel';
  data: string; // ASCII text, SVG code, or pixel data
  params: Record<string, any>;
  renderedAt: string;
}

/**
 * ASCII Art Generators
 */
export class ASCIIGenerator {
  /**
   * Create a fancy border around text
   */
  static border(text: string, style: 'simple' | 'double' | 'fancy' = 'double'): string {
    const lines = text.split('\n');
    const maxLength = Math.max(...lines.map(l => l.length));

    let top: string;
    let bottom: string;
    let left: string;
    let right: string;

    switch (style) {
      case 'simple':
        top = '─'.repeat(maxLength + 4);
        bottom = '─'.repeat(maxLength + 4);
        left = '│';
        right = '│';
        break;
      case 'double':
        top = '═'.repeat(maxLength + 2);
        bottom = '═'.repeat(maxLength + 2);
        left = '║';
        right = '║';
        break;
      case 'fancy':
        top = '╔' + '═'.repeat(maxLength) + '╗';
        bottom = '╚' + '═'.repeat(maxLength) + '╝';
        left = '║';
        right = '║';
        break;
    }

    const middle = lines
      .map(line => {
        const padded = line.padEnd(maxLength);
        return `${left} ${padded} ${right}`;
      })
      .join('\n');

    return `${top}\n${middle}\n${bottom}`;
  }

  /**
   * Create text art from characters
   */
  static textArt(text: string): string {
    const art = [
      `  ╔══════════════════════╗`,
      `  ║                       ║`,
      `  ║   ${text.padEnd(19)}║`,
      `  ║                       ║`,
      `  ╚══════════════════════╝`,
    ];
    return art.join('\n');
  }

  /**
   * Create emoji mosaic from grid
   */
  static emojiMosaic(grid: string[][], emoji: string = '✦'): string {
    return grid.map(row => row.join(emoji)).join('\n');
  }

  /**
   * Simple shape (box, diamond, cross)
   */
  static shape(type: 'box' | 'diamond' | 'cross', size = 5): string {
    const mid = Math.floor(size / 2);

    switch (type) {
      case 'box':
        return Array(size).fill(0).map((_, y) =>
          Array(size).fill(0).map((_, x) =>
            y === 0 || y === size - 1 || x === 0 || x === size - 1 ? '█' : ' '
          ).join('')
        ).join('\n');

      case 'diamond':
        return Array(size).fill(0).map((_, y) =>
          Array(size).fill(0).map((_, x) => {
            const dist = Math.abs(x - mid) + Math.abs(y - mid);
            return dist <= mid ? '█' : ' ';
          }).join('')
        ).join('\n');

      case 'cross':
        return Array(size).fill(0).map((_, y) =>
          Array(size).fill(0).map((_, x) =>
            x === y || x === size - 1 - y ? '█' : ' '
          ).join('')
        ).join('\n');
    }
  }
}

/**
 * SVG Generators
 */
export class SVGGenerator {
  /**
   * Create a gradient background SVG
   */
  static gradient(colors: string[], width = 400, height = 300): string {
    const stops = colors.map((c, i) => 
      `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${c}"/>`
    ).join('');

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          ${stops}
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
    </svg>`;
  }

  /**
   * Create a landscape SVG
   */
  static landscape(params: {
    mountains?: number;
    sunPosition?: 'left' | 'right' | 'center';
    colors?: { sky: string; ground: string; sun: string };
  }): string {
    const {
      mountains = 3,
      sunPosition = 'right',
      colors = { sky: '#87CEEB', ground: '#228B22', sun: '#FFD700' },
    } = params;

    const sunX = sunPosition === 'left' ? 50 : sunPosition === 'right' ? 350 : 200;
    const mountainPoints = Array.from({ length: mountains }, (_, i) => {
      const x = (i + 1) * (400 / (mountains + 1));
      const height = 100 + Math.random() * 150;
      return `${x},${300 - height}`;
    }).join(' ');

    return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <!-- Sky -->
      <rect width="100%" height="100%" fill="${colors.sky}"/>
      
      <!-- Sun -->
      <circle cx="${sunX}" cy="50" r="30" fill="${colors.sun}"/>
      
      <!-- Mountains -->
      <polygon points="0,300 ${mountainPoints} 400,300" fill="${colors.ground}" opacity="0.9"/>
      
      <!-- Ground -->
      <rect x="0" y="280" width="400" height="20" fill="${colors.ground}"/>
    </svg>`;
  }

  /**
   * Create a pattern SVG
   */
  static pattern(type: 'grid' | 'dots' | 'waves', colors: string[] = ['#333', '#666']): string {
    switch (type) {
      case 'grid':
        return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${colors[0]}" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>`;

      case 'dots':
        return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${colors[0]}"/>
          <circle cx="50" cy="50" r="3" fill="${colors[1]}"/>
          <circle cx="150" cy="100" r="5" fill="${colors[1]}"/>
          <circle cx="250" cy="50" r="4" fill="${colors[1]}"/>
          <circle cx="350" cy="150" r="6" fill="${colors[1]}"/>
        </svg>`;

      case 'waves':
        return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${colors[0]}"/>
          <path d="M0,150 Q100,100 200,150 T400,150" fill="none" stroke="${colors[1]}" stroke-width="3"/>
          <path d="M0,180 Q100,130 200,180 T400,180" fill="none" stroke="${colors[1]}" stroke-width="3"/>
          <path d="M0,210 Q100,160 200,210 T400,210" fill="none" stroke="${colors[1]}" stroke-width="3"/>
        </svg>`;
    }
  }

  /**
   * Generate agent avatar from name (deterministic)
   */
  static agentAvatar(agentName: string): string {
    // Hash name to colors
    const hash = Array.from(agentName).reduce((acc, char) => 
      acc + char.charCodeAt(0), 0
    );

    const colors = [
      `hsl(${hash % 360}, 70%, 50%)`,
      `hsl${(hash + 90) % 360}, 60%, 45%)`,
      `hsl${(hash + 180) % 360}, 65%, 55%)`,
    ];

    const patternTypes = ['grid', 'dots', 'waves'] as const;
    const patternType = patternTypes[hash % 3];

    return `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${colors[0]}" rx="10"/>
      ${this.pattern(patternType, colors)}
      <circle cx="50" cy="50" r="35" fill="none" stroke="${colors[2]}" stroke-width="4" opacity="0.5"/>
      <text x="50" y="55" text-anchor="middle" fill="${colors[1]}" font-size="12" font-weight="bold">
        ${agentName.substring(0, 2).toUpperCase()}
      </text>
    </svg>`;
  }
}

/**
 * Pixel Art Generators
 */
export class PixelGenerator {
  static palette = {
    gray: ['#1a1a1a', '#2d2d2d', '#404040', '#525252', '#666666', '#7a7a7a', '#8d8d8d', '#a0a0a0', '#b4b4b4', '#c7c7c7', '#dadada', '#ededed', '#ffffff'],
    retro: ['#0f0f0f', '#1f1f2e', '#38384e', '#554e5a', '#766b85', '#a392a4', '#e13b37', '#f0a14a', '#f67e2b', '#fce877', '#94e044', '#4ca4d8', '#4f5eb7', '#8d4496', '#ffffff'],
    nature: ['#1a3a1a', '#2d5a2d', '#408040', '#5aa85a', '#78c878', '#96e896'],
  };

  /**
   * Generate 16x16 pixel art grid
   */
  static generate16x16(type: 'noise' | 'checker' | 'stripes', colors = this.palette.retro): string[][] {
    const grid: string[][] = [];
    const w = 16, h = 16;

    switch (type) {
      case 'noise':
        for (let y = 0; y < h; y++) {
          const row: string[] = [];
          for (let x = 0; x < w; x++) {
            row.push(colors[Math.floor(Math.random() * colors.length)]);
          }
          grid.push(row);
        }
        break;

      case 'checker':
        for (let y = 0; y < h; y++) {
          const row: string[] = [];
          for (let x = 0; x < w; x++) {
            row.push(((x + y) % 2 === 0) ? colors[0] : colors[1]);
          }
          grid.push(row);
        }
        break;

      case 'stripes':
        for (let y = 0; y < h; y++) {
          const row: string[] = [];
          for (let x = 0; x < w; x++) {
            row.push(colors[(y + x) % colors.length]);
          }
          grid.push(row);
        }
        break;
    }

    return grid;
  }

  /**
   * Convert pixel grid to CSS data URI
   */
  static toDataURI(grid: string[][], scale = 10): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${grid[0].length * scale}" height="${grid.length * scale}">
      ${grid.map((row, y) =>
        row.map((color, x) =>
          `<rect x="${x * scale}" y="${y * scale}" width="${scale}" height="${scale}" fill="${color}"/>`
        ).join('')
      ).join('')}
    </svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}

/**
 * Main image generator - routes to appropriate generator
 */
export function generateImage(type: 'ascii' | 'svg' | 'pixel', params: any): AlgorithmicImage {
  const renderedAt = new Date().toISOString();

  switch (type) {
    case 'ascii':
      if (params.style === 'border') {
        return {
          type: 'ascii',
          data: ASCIIGenerator.border(params.text, params.borderStyle),
          params,
          renderedAt,
        };
      }
      if (params.style === 'textArt') {
        return {
          type: 'ascii',
          data: ASCIIGenerator.textArt(params.text),
          params,
          renderedAt,
        };
      }
      if (params.style === 'shape') {
        return {
          type: 'ascii',
          data: ASCIIGenerator.shape(params.shape, params.size),
          params,
          renderedAt,
        };
      }
      break;

    case 'svg':
      if (params.type === 'gradient') {
        return {
          type: 'svg',
          data: SVGGenerator.gradient(params.colors, params.width, params.height),
          params,
          renderedAt,
        };
      }
      if (params.type === 'landscape') {
        return {
          type: 'svg',
          data: SVGGenerator.landscape(params),
          params,
          renderedAt,
        };
      }
      if (params.type === 'pattern') {
        return {
          type: 'svg',
          data: SVGGenerator.pattern(params.pattern, params.colors),
          params,
          renderedAt,
        };
      }
      if (params.type === 'avatar') {
        return {
          type: 'svg',
          data: SVGGenerator.agentAvatar(params.agentName),
          params,
          renderedAt,
        };
      }
      break;

    case 'pixel':
      if (params.type === '16x16') {
        const grid = PixelGenerator.generate16x16(params.style, params.colors);
        return {
          type: 'pixel',
          data: PixelGenerator.toDataURI(grid, params.scale),
          params,
          renderedAt,
        };
      }
      break;
  }

  // Default - simple border
  return {
    type: 'ascii',
    data: ASCIIGenerator.border('Hello Twitterbot!', 'double'),
    params: { style: 'border', text: 'Hello Twitterbot!', borderStyle: 'double' },
    renderedAt,
  };
}
