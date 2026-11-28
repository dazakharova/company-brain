import { renderCustomersScreen } from './screens/customers.js';
import { mockCustomersService } from './services/customers.js';

const screen = document.querySelector('#screen');
renderCustomersScreen(screen, { customerService: mockCustomersService });
