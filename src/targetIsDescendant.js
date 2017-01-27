export default function targetIsDescendant(target, parent) {
  while (target !== document) {
    // if the target hits null before it hits the document, that means
    // its parent got unmounted, so assume it is (was) a descendant
    if (target === parent || target === null) return true;
    target = target.parentNode;
  }
  return false;
}

