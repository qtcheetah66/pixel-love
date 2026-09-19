# GitHub Pages 发布说明

把本目录中的全部文件上传到 GitHub 仓库的根目录，确保 `index.html` 位于仓库根目录，而不是再套一层文件夹。

1. 在 GitHub 新建一个公开仓库，例如 `little-days-westie-home`。
2. 点击 **Add file → Upload files**，上传本目录全部内容（包括 `.nojekyll`）。
3. 打开仓库 **Settings → Pages**。
4. 在 **Build and deployment** 中选择 **Deploy from a branch**。
5. Branch 选择 `main`，目录选择 `/ (root)`，点击 **Save**。
6. 等待约一分钟，GitHub 会显示公开网址：
   `https://你的用户名.github.io/little-days-westie-home/`

如果仓库不是公开仓库，别人可能无法访问；仓库必须设为 **Public**。以后把新版本文件再次上传到根目录，Pages 会自动更新。
