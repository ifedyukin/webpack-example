import {router} from 'lib/router';
import {Title, Description, Image} from '../../components/index.js';

export default async (id) => {
  const requestedItems = await fetch('/assets/items.json');
  const items = await requestedItems.json();
  const item = items.find(({id: itemId}) => id === itemId);
  if (!item) return router.navigate('/404');

  const divElement = document.createElement('div');
  divElement.id = 'item';
  divElement.appendChild(Title(item.label));
  divElement.appendChild(Description(item.description));
  divElement.appendChild(Image(`/assets/items/item${id}.png`));
  return divElement;
};
