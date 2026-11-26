import { AnalyzeImageResponse } from "./nutrition-api";

interface ScanStore {
  analysis: AnalyzeImageResponse | null;
  imageUri: string | null;
}

let currentStore: ScanStore = {
  analysis: null,
  imageUri: null,
};

export const setNutritionScanResult = (result: AnalyzeImageResponse, uri: string) => {
  currentStore = {
    analysis: result,
    imageUri: uri,
  };
};

export const getNutritionScanResult = (): ScanStore => {
  return currentStore;
};

export const clearNutritionScanResult = () => {
  currentStore = {
    analysis: null,
    imageUri: null,
  };
};
