#Setup
1. [Fork **please.js**](https://help.github.com/articles/fork-a-repo) and clone it on your system.
2. Create a new branch out off `master` for your fix/feature. `git checkout new-feature master`

#Building

**please.js** uses [Grunt](http://gruntjs.com/) for the build process which you need to have installed on your system.

To install all the dependencies, run `npm install`.

Once you have the dependencies installed, run `grunt` from the project directory.


#Things to remember
- Do not fix multiple issues in a single commit. Keep them one thing per commit so that they can be picked easily incase only few commits require to be merged.

- Version 0.1.7 onwards, the `master` branch will only contain stable releases that have been well tested. So when sending a pull request, please sending against `develop` instead of `master`.

- Before submitting a patch, rebase your branch on upstream `develop` to make life easier for the merger.

- **DO NOT** add the library builds (`please.min.js`) in your commits.
