// @flow

import React from 'react'
import { type Element } from 'react'

require('./main.css')

type SpinnerProps = {
  className: string,
}

const Spinner = (props: SpinnerProps): Element<'div'> =>
  React.createElement('div', { className: `spinner ${props.className}` })

export default Spinner

