import { mount } from 'svelte';
import Workshop from './Workshop.svelte';

export default mount(Workshop, {
  target: document.getElementById('app')!,
});
