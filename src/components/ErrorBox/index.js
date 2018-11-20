// @flow

import React from 'react'
import { type Element } from 'react'

import config from '../../config'

require('./main.css')

type ErrorProps = {
  msg: string,
}

const ErrorBox = (props: ErrorProps): Element<'div'> =>
  React.createElement(
    'div',
    { className: 'error-box' },
    React.createElement('img', {
      src: `${config.basepath}/static/tsomi-errors.svg`,
      className: 'error-icon',
    }),
    React.createElement('div', {}, props.msg),
  )

export default ErrorBox
