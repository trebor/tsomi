// @flow

type HttpErrorType = {
  type: string,
  statusCode: number,
  message: string,
}

const HttpError = (statusCode: number, message: string): HttpErrorType => ({
  type: 'HttpError',
  statusCode,
  message,
})


const httpErrorPromise = (response: Response): Promise<any> => {
  if (response.headers.get('Content-Type').startsWith('application/json')) {
    return response.json().then((js) => { throw HttpError(response.status, js.errorMessages) })
  }
  return response.text().then((text) => { throw HttpError(response.status, text) })
}


/* pulled this directly from https://stackoverflow.com/questions/35325370/how-to-post-a-x-www-form-urlencoded-request-from-react-native */
const encodeFormBody = (params: {}): string =>
  /* TODO: can this be more easily expressed with lodash/fp? */
  Object.keys(params).map(key =>
    `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&')

module.exports = {
  HttpError,
  encodeFormBody,
  httpErrorPromise,
}

