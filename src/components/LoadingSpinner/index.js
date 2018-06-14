// @flow

import React from 'react'
import { type Element } from 'react'

require('./main.css')

type LoadingSpinnerProps = {
  className: string,
}

const LoadingSpinner = (props: LoadingSpinnerProps): Element<'div'> =>
  React.createElement('div', { className: `loader ${props.className}` })

export default LoadingSpinner

