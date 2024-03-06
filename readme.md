# Dental Age Estimation

#### Deployment Notes

Once tested and ready for deploy:
- Zip any changes to analysis files in `runtime-files`
- Increase version number in `package.json`
- Commit/push changes
- `git tag vX.Y.Z`
- `git push --tags`
- Run `npm run make` to build the distributable
- Draft a new release on GitHub
	- Title = X.Y.Z
	- Add release notes, link to issues
	- Upload/Attach zip file from `out/make/zip` folder
- Publish release
