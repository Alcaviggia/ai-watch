import { mount } from 'svelte';
import Unboxing from './Unboxing.svelte';

export default mount(Unboxing, {
  target: document.getElementById('app')!,
});
