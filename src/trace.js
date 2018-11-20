// @flow

const trace = (header: string) => (res: any) => {
  /* eslint no-console: "off" */
  console.log(`[${header}]`, res)
  return res
}

export default trace
