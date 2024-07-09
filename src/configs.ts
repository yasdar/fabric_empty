import Coloris from "@melloware/coloris";
export const addColorPicker = (func:any)=>{
    Coloris.setInstance('.instance1', {
      closeButton: true,
      closeLabel: 'OK',
      clearButton: true,
      clearLabel: 'Clear',
      onChange: func
    });
  }