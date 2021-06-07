import { FC, memo, MemoExoticComponent } from 'react';

const NEVER_UPDATE = () => true;

export default function constant<P>(component: FC<P>): MemoExoticComponent<FC<P>> {
  return memo(component, NEVER_UPDATE);
}
