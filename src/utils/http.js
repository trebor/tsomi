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


type FetchRequestParameters = {
  method: string
}


/* Lifted, with minor modifications, from https://davidwalsh.name/fetch-timeout */
const fetchWithTimeout = (
  source: string | Request,
  parameters: FetchRequestParameters,
  ttl: number,
): Promise<any> =>
  new Promise((resolve, reject) => {
    let didTimeOut = false

    const timer = setTimeout(() => {
      didTimeOut = true
      reject(new Error('request timed out'))
    }, ttl)

    fetch(source)
      .then((response) => {
        clearTimeout(timer)
        if (!didTimeOut) {
          resolve(response)
        }
      })
      .catch((err) => {
        if (didTimeOut) return
        reject(err)
      })
  })

module.exports = {
  HttpError,
  encodeFormBody,
  httpErrorPromise,
  fetchWithTimeout,
}

