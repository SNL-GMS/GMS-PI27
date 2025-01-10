const IGNORE_PATTERN = /\.yarn|\.pnp/;

const GIT_ADD_COMMAND = 'git add';
const PRETTIER_COMMAND = 'yarn prettier -c .prettierrc --write';
const ESLINT_COMMAND = `yarn eslint --config .eslintrc.yaml --fix --quiet`;

const filterAndJoin = filenames => {
  filenames = filenames.filter(fn => !IGNORE_PATTERN.test(fn)); // exclude any ignored patterns
  return filenames.length ? "'" + filenames.join("' '") + "'" : '';
};

export default {
  // runs prettier command
  './**/*.{md,css,scss,json,yml,yaml,xml,mjs,cjs}': filenames => {
    const names = filterAndJoin(filenames);
    return names.length > 0 ? [`${PRETTIER_COMMAND} ${names}`, `${GIT_ADD_COMMAND} ${names}`] : [];
  },

  // runs eslint with prettier command
  './**/*.{ts,tsx,js,jsx}': filenames => {
    const names = filterAndJoin(filenames);
    return names.length > 0 ? [`${ESLINT_COMMAND} ${names}`, `${GIT_ADD_COMMAND} ${names}`] : [];
  }
};
