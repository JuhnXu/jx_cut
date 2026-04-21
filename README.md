# 图片切割工具

一个可直接部署到 GitHub Pages 的静态图片切割网站。

https://juhnxu.github.io/jx_cut/

## 功能

- 拖拽或点击上传图片
- 按横向和纵向份数切割
- 实时预览分割线与编号
- 一键下载所有切片 ZIP
- 适配桌面和移动端

## 本地打开

直接双击 `index.html` 即可使用。

如果你想用本地服务器预览，也可以在当前目录执行：

```powershell
python -m http.server 8080
```

然后访问 `http://localhost:8080`

## 上传到 GitHub

1. 在 GitHub 新建一个仓库
2. 把当前目录文件上传到仓库根目录
3. 进入仓库 `Settings`
4. 打开 `Pages`
5. 在 `Build and deployment` 里选择：
   `Source` -> `Deploy from a branch`
6. 选择 `main` 分支和 `/ (root)` 目录
7. 保存后等待 GitHub Pages 发布

发布完成后，就可以通过 GitHub Pages 链接访问。

## 文件结构

```text
index.html
styles.css
script.js
README.md
vendor/jszip.min.js
```

## 说明

- 切片编号顺序为：从左到右、从上到下
- 导出的图片格式统一为 `png`
- `vendor/jszip.min.js` 已包含在项目内，上传到 GitHub 后可直接使用
