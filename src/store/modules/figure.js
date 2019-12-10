import StoreList from './storelist';
import { api } from '@/services/api';

let store = StoreList.create( api.figure );
export default {
    namespaced: true,...store
}
