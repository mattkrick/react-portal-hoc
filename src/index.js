import React, {Component, cloneElement} from 'react';
import {
  findDOMNode,
  unmountComponentAtNode,
  unstable_renderSubtreeIntoContainer as renderSubtreeIntoContainer
} from 'react-dom';
import targetIsDescendant from './targetIsDescendant';

export default (options = {}) => ComposedComponent => {
  return class PortalHoc extends Component {
    componentDidMount() {
      const isOpen = this.makeSureValue('isOpen');
      this.ensurePortalState(isOpen);
    }

    // use componentDidUpdate because variables might get passed to the modal & those should be the latest
    componentDidUpdate() {
      const {isOpen} = this.props;
      const keepOpen = this.isClosing ? false : isOpen;
      const openState = this.toggle ? Boolean(this.node) : keepOpen;
      // we can't wrap this in a prevProps.isOpen !== this.props.isOpen conditional
      // because it's possible data changed without an unmount
      this.ensurePortalState(openState);
    }

    componentWillUnmount() {
      this.ensureClosedPortal();
    }

    ensureClosedPortal = () => {
      if (this.node && !this.isClosing) {
        this.isClosing = true;
        this.handleListeners('removeEventListener');
        const closeAfter = this.makeSureValue('closeAfter');
        this.portal = renderSubtreeIntoContainer(
          this,
          <ComposedComponent
            {...this.props}
            closeAfter={closeAfter}
            closePortal={this.ensureClosedPortal}
            isClosing={true}
          />,
          this.node
        );
        if (closeAfter === undefined || closeAfter === null) {
          // unmount right away if there is no animation to wait for
          this.unmount();
        } else if (closeAfter === 'animation') {
          // listen for keyframe animations and unmount after it finishes
          const removeNode = () => {
            this.node.removeEventListener('animationend', removeNode);
            this.unmount();
          };
          this.node.addEventListener('animationend', removeNode);
        } else if (typeof closeAfter === 'function') {
          // let the user-defined promise tell us when to ummount
          closeAfter(this.node)
            .then(() => {
              this.unmount();
            })
        } else {
          const delay = parseInt(closeAfter) || 0;
          setTimeout(() => {
            this.unmount()
          }, delay);
        }
      }
    };

    ensureOpenPortal = () => {
      if (!this.node) {
        this.node = document.createElement('div');
        this.node.id = this.makeSureValue('nodeId') || 'portal';
        this.node.setAttribute('react-portal', '');
        document.body.appendChild(this.node);
        this.handleListeners('addEventListener');
      }

      // we could make some performance gains by doing a shallow equal on the props
      const closeAfter = this.makeSureValue('closeAfter');
      this.portal = renderSubtreeIntoContainer(
        this,
        <ComposedComponent
          {...this.props}
          closeAfter={closeAfter}
          closePortal={this.ensureClosedPortal}
        />,
        this.node
      );
    };

    ensurePortalState(isOpen) {
      if (isOpen) {
        this.ensureOpenPortal();
      } else {
        this.ensureClosedPortal();
      }
    }

    handleListeners(method) {
      const escToClose = this.makeSureValue('escToClose');
      const clickToClose = this.makeSureValue('clickToClose');

      const handle = document[method].bind(document);
      if (escToClose) {
        handle('keydown', this.handleKeydown);
      }
      if (clickToClose) {
        handle('click', this.handleDocumentClick);
        handle('touchstart', this.handleDocumentClick);
      }
    }

    handleDocumentClick = (e) => {
      // close as long as they didn't click the modal or the toggle
      if (!targetIsDescendant(e.target, findDOMNode(this.portal))) {
        if (!this.toggle || !targetIsDescendant(e.target, findDOMNode(this.toggle))) {
          this.ensureClosedPortal();
        }
      }
    };

    handleKeydown = (e) => {
      if (e.key === 'Escape') {
        this.ensureClosedPortal();
      }
    };

    makeSureValue(val) {
      return this.props[val] === undefined ? options[val] : this.props[val];
    }

    togglePortal = () => {
      if (this.node) {
        this.ensureClosedPortal();
      } else {
        this.ensureOpenPortal();
      }
    };

    unmount = () => {
      const node = this.node;
      this.portal = null;
      this.node = null;
      this.toggle = null;
      this.isClosing = null;

      // calling this will cause a rerender, which could cause a re-open if this.node is not null
      unmountComponentAtNode(node);
      document.body.removeChild(node);
    };

    render() {
      const toggle = this.makeSureValue('toggle');
      if (toggle) {
        const onClick = (e) => {
          if (toggle.props.onClick) {
            toggle.props.onClick(e);
          }
          // the above click handler might be setting the state for the portal, and setState is async
          setTimeout(() => this.togglePortal(), 0);
        };
        const ref = (c) => {
          this.toggle = c
        };
        return cloneElement(toggle, {onClick, ref});
      }
      return null;
    }

  }
}
