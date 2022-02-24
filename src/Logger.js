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
};
