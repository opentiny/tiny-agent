import { BomActions } from './bom-actions';
import { DomActions } from './dom-actions';

export const BaseActions = [...BomActions, ...DomActions];
