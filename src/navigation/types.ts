import { Repuesto } from '../types';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Detail: { repuesto: Repuesto };
};

export type BottomTabParamList = {
  InicioTab: undefined;
  CategoriasTab: undefined;
  FavoritosTab: undefined;
  PreOrdenTab: undefined;
  PerfilTab: undefined;
};
