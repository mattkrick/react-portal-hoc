# react-portal-hoc
A HOC that portalizes components

## Installation
`yarn add react-portal-hoc`

## What's it do
This is a simple little higher-order component (HOC) for portalizing a component.
A portal is used to create a DOM node outside of the standard react render tree.
This is useful for things like modals, menus, and anything that's tempting you to use `position: 'fixed'`.

## How's it different from...
- react-portal: this is a wrapper, and unfortunately a little buggy at the time I wrote this
- react-modal: this is just for modals, not great for making custom things like dropdown menus
- react-gateway: the DX for this is not as friendly as the above 2 

## Usage

### Stick it around your component

Example:

```js
// in Modal.js
import portal from 'react-portal-hoc';
// isClosing is automatically provided by the HOC
const Modal = () => <div className={props.isClosing ? 'closing' : ''}>Here i am</div>;
const options = {
  closeAfter: 'animation',
  escToClose: true,
  clickToClose: false
};
export default portal(options)(Modal);

// in Button.js
// closePortal is automatically provided by the HOC
const Button = (props) => <button onClick={() => props.closePortal()}>{props.label}</button>;

// in StatelessComponent.js
// passing in clickToClose here overrides the static option set in Modal.js
const StatelessComponent = () => <Modal toggle={<Button label="Click me hard"/>} clickToClose/>;
```

## API

```
portal(options)(Component)
```

Options:
- `closeAfter`: If not present, close the portal immediately.
If it is a number, close it after that many milliseconds.
If it is `'animation'`, close it after the next css animation completes.
If it is a function that returns a promise, return it after it resolves.
For convenience, this option is passed down as a prop when `isClosing === true` so you can use it to time your animation. 
- `clickToClose`: Default is `false`. If `true`, clicking outside of the portal will close it
- `clickToEsc`: Default is `false`. If `true`, hitting Escape will close the portal
- `toggle`: An element that will toggle the portal popping up or going away. 
If clicked while the portal is open, the portal will close.
- `isOpen`: Default is `false`. If you don't provide a `toggle` and want to manually manage the portal, use this.
While this could be used in conjunction with a `setTimeout`, 
be warned that if you do, there is a special place in hell for you. 
- `nodeId`: Default is `'portal'`. 
An `id` to assign to the DOM node. 
Useful if you need to break out of the VDOM and traverse the DOM tree (eg see if a target is a descendant of a portal)
The DOM element is also decorated with a `react-portal` attribute

## FAQ

Q: How do I use this without a toggle?
A: Use `isOpen` instead of `toggle`.

Q: When the portal is open and they click the toggle again, the portal closes. I want it to do nothing.
A: Your UX is bad and you should feel bad. Ugh, fine. Use `isOpen` instead of `toggle`.

Q: Should I pass things in via props or options?
A: Pass default (static) values into options and overrides into props. 
For example, I have a credit card modal that usually has `clickToClose = true` in the options.
This is good if they go into their account settings and update their billing info.
However, if their card gets denied, I'm gonna pop it up immediately and 
set the prop `clickToClose = false` because I'm a greedy a-hole.

Q: How do I close the portal by clicking a button on my modal?
A: The HOC will add `props.closePortal` to your toggle. Use it with the `onClick` handler.

Q: How can I do animations?
A: To animate in, just use a keyframe animation or `componentDidMount`. 
When the component loads, the animation will execute.
Animating out is more difficult because we want to signal the close, animate the close, 
then unmount after the animation completes.
When a close signal is received, the HOC will add `props.isClosing` and `props.closeAfter` to your portal.
You can use `isClosing` to add/remove classnames (see example above).
If you passed in a number to `closeAfter`, 
you can do something like 
``animationDuration: `${props.closeAfter}ms` ``.
If that's too much work for a simple keyframe animation, use `closeAfter='animation'` 
to close after the next animation completes.
For complex use cases, including escaping the react vdom, variable duration, and multiple animations,
I'd suggest just returning a promise.
For example: `options.closeAfter = (domNode) => new Promise(resolve => setTimeout(() => resolve(), 300))`

## License

MIT
