// @flow

const React = require('react')
const { createSliderWithTooltip } = require('rc-slider')
const Slider = require('rc-slider').default
require('rc-slider/assets/index.css')
require('./main.css')


const { inputElement } = require('../../eventtypes')

type SearchState = {
  name: string
}

type SearchProps = {
  influencers: number,
  influenced: number,
  updateInfluencers: Function,
  updateInfluences: Function,
}

class Search extends React.Component<SearchProps, SearchState> {
  constructor(props: SearchProps) {
    super(props)
    this.props = props
    this.state = {
      name: ''
    }
  }

  submit() {
    console.log(this.state.name)
  }

  keyUp(e: KeyboardEvent) {
    e.keyCode === 13
      ? this.submit()
      : this.setState({ name: inputElement(e.target).value })
  }

  render() {
    const { influencers, influenced } = this.props
    const searchGlyph = React.createElement('span', {}, '🔍')

    const slider = createSliderWithTooltip(Slider) //React.createElement(Slider, {})
    const input = React.createElement('input', {
      onKeyUp: e => this.keyUp(e),
      placeholder: 'Search...', 
      type: 'text', 
    })

    const submit = React.createElement('button', { onClick: () => this.submit() }, 'GO')
   
    const sliderGroup = React.createElement('div', { className: 'slider-group' }, 
      React.createElement('div', { id: 'influencers-slider' },
        React.createElement('span', {}, 'Influencers'),

        React.createElement(Slider, {
          defaultValue: influencers,
          min: 0,
          max: 25,
          onChange: this.props.updateInfluencers
        }),
        
        React.createElement('span', {}, influencers.toString())
      ),

      React.createElement('div', { id: 'influenced-slider' },
        React.createElement('span', {}, 'Influenced'),

        React.createElement(Slider, {
          defaultValue: influenced,
          min: 0,
          max: 25,
          onChange: this.props.updateInfluences
        }),

        React.createElement('span', {}, influenced.toString())
      )
    )

    return React.createElement('div', { className: 'search' }, 
      searchGlyph,
      input,
      submit,
      sliderGroup
    )
  }
}

module.exports = { Search }

