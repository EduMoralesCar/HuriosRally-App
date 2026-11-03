import { Repuesto } from '../types';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Detail: { repuesto: Repuesto };
  Reports: undefined;
};

export type BottomTabParamList = {
  InicioTab: undefined;
  CategoriasTab: undefined;
  FavoritosTab: undefined;
  PreOrdenTab: undefined;
  ReportesTab: undefined;
  PerfilTab: undefined;
};
