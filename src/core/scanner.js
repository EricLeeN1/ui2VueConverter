import { glob } from 'glob';
import path from 'path';
import fs from 'fs-extra';
import sharp from 'sharp';

export class Scanner {
  constructor(inputDir, presetConfig = null) {
    this.inputDir = inputDir;
    this.presetConfig = presetConfig;
  }

  async scan() {
    // 查找所有图片文件
    const imageFiles = await glob('**/*.{png,jpg,jpeg}', {
      cwd: this.inputDir,
      absolute: true,
      ignore: ['**/.DS_Store']
    });

    // 按二级目录分组（一级目录/二级目录 = 一个页面）
    const groups = {};
    const cutDirs = ['切图', 'assets', 'icons', 'sprites', 'cut', 'images'];

    for (const file of imageFiles) {
      const relativePath = path.relative(this.inputDir, file);
      const parts = relativePath.split(path.sep);

      // 跳过切图目录
      if (parts.some(part => cutDirs.includes(part.toLowerCase()) || cutDirs.includes(part))) {
        continue;
      }

      // 二级目录结构：一级目录/二级目录/图片
      // 一级目录 = 业务模块（如首页、订单）
      // 二级目录 = 页面类型（如列表、详情、退回）
      let moduleName, pageType;

      if (parts.length >= 3) {
        // 有二级目录
        moduleName = parts[0];
        pageType = parts[1];
      } else if (parts.length === 2) {
        // 只有一级目录，视为单页面模块
        moduleName = parts[0];
        pageType = 'index';
      } else {
        // 根目录图片
        moduleName = path.basename(file, path.extname(file)).split(/[-_@]/)[0];
        pageType = 'index';
      }

      // 页面唯一标识：模块名-页面类型
      const moduleNameEn = this.mapName(moduleName);
      const pageTypeEn = this.mapName(pageType);
      const pageKey = `${moduleNameEn}-${pageTypeEn}`;
      const pageName = `${moduleNameEn}${pageTypeEn !== 'index' ? '-' + pageTypeEn : ''}`;

      // 识别状态和倍数
      const fileName = path.basename(file, path.extname(file));
      const state = this.detectState(fileName);
      const scale = this.detectScale(fileName);

      if (!groups[pageKey]) {
        groups[pageKey] = {
          name: pageName,
          moduleName,
          pageType,
          componentName: this.getComponentName(pageName),
          routePath: this.generateRoutePath(moduleName, pageType),
          states: [],
          cutImages: [],
          designWidth: this.presetConfig ? this.presetConfig.getDesignWidth() : 375
        };
      }

      groups[pageKey].states.push({
        file,
        state,
        scale,
        description: fileName
      });
    }

    // 为每个页面查找切图
    for (const pageKey of Object.keys(groups)) {
      const group = groups[pageKey];
      group.cutImages = await this.findCutImages(group.moduleName, group.pageType);
    }

    // 自动检测设计图实际像素宽度
    const firstDesignImage = imageFiles.find(file => {
      const relativePath = path.relative(this.inputDir, file);
      const parts = relativePath.split(path.sep);
      return !parts.some(part => cutDirs.includes(part.toLowerCase()) || cutDirs.includes(part));
    });

    if (firstDesignImage) {
      try {
        const metadata = await sharp(firstDesignImage).metadata();
        const actualWidth = metadata.width;
        for (const group of Object.values(groups)) {
          group.actualImageWidth = actualWidth;
        }
        console.log(`📐 检测到设计图实际宽度: ${actualWidth}px`);
      } catch (e) {
        // 忽略读取失败，继续使用配置文件的 designWidth
      }
    }

    return Object.values(groups);
  }

  // 名称映射：中文目录名 -> 英文
  mapName(name) {
    if (!this.presetConfig) return name;
    const nameMap = this.presetConfig.get().nameMap || {};
    return nameMap[name] || name;
  }

  // 根据 preset 生成文件名
  getComponentName(pageName) {
    if (this.presetConfig) {
      return this.presetConfig.getFileName(pageName);
    }
    return this.toPascalCase(pageName) + '.vue';
  }

  // 生成路由路径
  generateRoutePath(moduleName, pageType) {
    const moduleNameEn = this.mapName(moduleName);
    const pageTypeEn = this.mapName(pageType);
    const baseRoute = '/' + this.toKebabCase(moduleNameEn);
    if (pageTypeEn === 'index' || pageTypeEn === '列表') {
      return baseRoute;
    }
    return baseRoute + '/' + this.toKebabCase(pageTypeEn);
  }

  // 查找页面组对应的切图
  async findCutImages(moduleName, pageType) {
    const cutDirs = ['切图', 'assets', 'icons', 'sprites', 'cut', 'images'];
    const cutImagesMap = new Map();  // 用Map去重，保留最高倍数

    for (const cutDir of cutDirs) {
      // 页面级切图：模块/页面类型/切图/
      const pageCutPath = path.join(this.inputDir, moduleName, pageType, cutDir);
      if (fs.existsSync(pageCutPath)) {
        await this.scanCutDir(pageCutPath, cutImagesMap, 'page');
      }

      // 模块级切图：模块/切图/
      const moduleCutPath = path.join(this.inputDir, moduleName, cutDir);
      if (fs.existsSync(moduleCutPath)) {
        await this.scanCutDir(moduleCutPath, cutImagesMap, 'module');
      }

      // 全局切图：根目录/切图/
      const globalCutPath = path.join(this.inputDir, cutDir);
      if (fs.existsSync(globalCutPath)) {
        await this.scanCutDir(globalCutPath, cutImagesMap, 'global');
      }
    }

    return Array.from(cutImagesMap.values());
  }

  // 扫描切图目录，去重并保留最高倍数
  async scanCutDir(dirPath, cutImagesMap, scope) {
    const files = await glob('*.{png,jpg,jpeg,svg}', {
      cwd: dirPath,
      absolute: true
    });

    for (const file of files) {
      const fullName = path.basename(file, path.extname(file));
      const scale = this.detectScale(fullName);
      // 去掉倍数后缀得到基础名称
      const baseName = fullName.replace(/@\d+x$/i, '');

      // 检查是否已有同名切图
      const existing = cutImagesMap.get(baseName);
      if (existing) {
        // 已存在，比较倍数，保留更高的
        if (scale > existing.scale) {
          cutImagesMap.set(baseName, {
            file,
            name: baseName,
            fullName,
            scale,
            type: this.detectCutType(baseName),
            scope
          });
        }
      } else {
        // 新切图
        cutImagesMap.set(baseName, {
          file,
          name: baseName,
          fullName,
          scale,
          type: this.detectCutType(baseName),
          scope
        });
      }
    }
  }

  // 识别切图类型
  detectCutType(fileName) {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('icon') || lowerName.includes('图标')) return 'icon';
    if (lowerName.includes('btn') || lowerName.includes('button') || lowerName.includes('按钮')) return 'button';
    if (lowerName.includes('logo')) return 'logo';
    if (lowerName.includes('tab') || lowerName.includes('标签')) return 'tab';
    if (lowerName.includes('badge') || lowerName.includes('徽章')) return 'badge';
    if (lowerName.includes('tag') || lowerName.includes('标记')) return 'tag';
    if (lowerName.includes('arrow') || lowerName.includes('箭头')) return 'arrow';
    if (lowerName.includes('bg') || lowerName.includes('背景')) return 'background';
    return 'other';
  }

  detectState(fileName) {
    const lowerName = fileName.toLowerCase();
    // 先识别特殊状态
    if (lowerName.includes('空') || lowerName.includes('无数据') || lowerName.includes('empty')) return 'empty';
    if (lowerName.includes('加载') || lowerName.includes('loading') || lowerName.includes('骨架')) return 'loading';
    if (lowerName.includes('错误') || lowerName.includes('error') || lowerName.includes('失败')) return 'error';
    // 页面类型
    if (lowerName.includes('list') || lowerName.includes('列表') || lowerName.includes('首页')) return 'list';
    if (lowerName.includes('detail') || lowerName.includes('详情')) return 'detail';
    if (lowerName.includes('form') || lowerName.includes('编辑') || lowerName.includes('新建')) return 'form';
    if (lowerName.includes('success') || lowerName.includes('成功')) return 'success';
    return 'default';
  }

  // 识别图片倍数
  detectScale(fileName) {
    const match = fileName.match(/@(\d+)x$/i);
    if (match) {
      return parseInt(match[1]);
    }
    return 1;  // 无倍数标记默认为 1x
  }

  toPascalCase(str) {
    return str.replace(/(^|[-_/\. ])(\w)/g, (_, __, c) => c.toUpperCase()).replace(/[-_/\. ]/g, '');
  }

  toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }
}
