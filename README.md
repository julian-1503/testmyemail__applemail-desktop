# MacOS Apple Mail application 

NodeJS application that allows to take email previews on the Apple's Mail native app.

- ✨Magic ✨


## Tech

uses a number of open source projects to work properly:

- [NodeJS](https://nodejs.org/es/) - LTS version
- [AppleScript](https://developer.apple.com/library/archive/documentation/AppleScript/Conceptual/AppleScriptLangGuide/introduction/ASLR_intro.html) - to manipulate the Mail app through accessibility features.
- [cliclick](https://github.com/BlueM/cliclick) - a library to manipulate the cursor position on macos.
- [pm2](https://pm2.keymetrics.io/) - to manage self recovery.

## Installation

Requires: 
- [Node.js](https://nodejs.org/) LTS+ to run.
- [pm2](https://pm2.keymetrics.io/) - to manage self recovery.
- [cliclick](https://github.com/BlueM/cliclick) - a library to manipulate the cursor

Install cliclick with [Homebrew](https://brew.sh/index_es)
```sh
brew install cliclick
```

Install pm2 globally with `npm`
```sh
npm i -g pm2
```
Install the dependencies and devDependencies and start the server.

```sh
cd macos-desktop-client-applemail15
npm i
npm start
```

## Troubleshooting


## License

