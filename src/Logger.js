import chalk from "chalk";

export default {
  info: (data) => {
    console.log(chalk.bold.yellow(data));
  },

  dump: (json) => {
    console.dir(json, { depth: null, colors: true });
  },

  label: (text) => {
    console.log(chalk.bold.blue(text));
  },

  error: (text) => {
    console.error(chalk.bold.red(text));
  },

  debug: (text) => {
    console.log(chalk.bold.gray(text));
  },

  effect: (text) => {
    console.log(chalk.bold.magenta(text));
  },
};
