# react-portal-hoc
A HOC that portalizes components

##Installation
`yarn add react-portal-hoc`

## What's it do
This is a simple little higher-order component (HOC) for portalizing a component.
A portal is used to create a DOM node outside of the standard react render tree.
This is useful for things like modals, menus, and anything that's tempting you to use `position: 'fixed'`.

## How's it different from...
- react-portal: this is a wrapper, and unfortunately a little buggy at the time I wrote this
- react-modal: this is just for modals, not great for making custom things like dropdown menus
- react-gateway: the DX for this is not as friendly as the above 2 

##Usage

### Stick it around your component

Example:

```js
// in Modal.js
import portal from 'react-portal-hoc';
const Modal = (props) => {
  return <div>Here i am</div>
};
const options = {
  // these will get overwritten by the value passed in via props
  escToClose: true,
  clickToClose: false
};
export default portal(options)(Modal);

// in Button.js

const Button = (props) => {
  // closePortal is automatically provided by the HOC
  const {closePortal, label} = props;
  const onClick = () => {
    closePortal();
  };
  return <button onClick={onClick}>{label}</button>;
};

// in statelessComponent.js
const statelessComponent = (props) => {
  return (
    <div>
      <Modal toggle={<Button label="Click me hard"/>} clickToClose/>
    </div>
  )
}

```

##API

```
portal(options)(Component)
```

Options:
- `clickToClose`: Default is `false`. If true, clicking outside of the portal will close it
- `clickToEsc`: Default is `false`. If true, hitting Escape will close the portal
- `toggle`: An element that will toggle the portal popping up or going away. 
If clicked while the portal is open, the portal will close.
- `isOpen`: Default is `false`. If you don't provide a `toggle` and want to manually manage the portal, use this.
While this could be used in conjunction with a `setTimeout`, 
be warned that if you do, there is a special place in hell for you. 

## License

MIT
