import $ from "jquery";
import * as fabric from "fabric";
import { addColorPicker } from "./configs";
import "@melloware/coloris/dist/coloris.css";
import Coloris from "@melloware/coloris";




export class App
{

  canvas: fabric.Canvas; //The FabricJS Canvas object 
  //which will hold all the drawn elements
  currentUIimage:HTMLElement;
  imageOffsetY :number =0;
  imageOffsetX :number =0;

  groupBase:fabric.Group;

  activeObject:any=null;


  isScrolling:boolean = false;

  scaleFactor:number = 1;
constructor(private readonly selector: string, 
canvasHeight: number, 
canvasWidth: number) {


//Replace the given element with a canvas
$(`#${selector}`)
.replaceWith(`<canvas id="${selector}" height=${canvasHeight} width=${canvasWidth}> </canvas>`);

//Instantiate a new FabricJS Canvas on the created Canvas element.
this.canvas = new fabric.Canvas(`${selector}`, { 
  selection: false, //can select all elements!
  hoverCursor: 'pointer',
 // targetFindTolerance: 2,
  enableRetinaScaling : true
 });
//canvas background color
this.canvas.backgroundColor = 'yellow';
//add the logo
this.getImage(this.canvas,'./assets/logo.png');
//show ave button 
$(".bts").show();
$(".bts").css({top: "5px" , left: "5px"});
//base group : contain the base image 
this.groupBase = new fabric.Group([], {
  left: 0,
  top: 0
});
this.canvas.add(this.groupBase);
//base image non slectable
this.groupBase.set('selectable', false); 

this.canvas.renderAll();
// UI select shape
 this.DragDropFromDiv();
//init color picker
Coloris.init();
Coloris.coloris({el: "#coloris",themeMode: 'dark',alpha: false,margin: 20});
 addColorPicker((color:any) =>{
  console.log('apply color ',color);
  this.TintImage(color.toString());
  this.canvas.renderAll();
});

//delete object
$('#removeObj').on('click', (e: any) => {
  if( !this.activeObject || !this.activeObject.src){return;}
  this.canvas.remove(this.activeObject);
  this.activeObject = null;
  this.HideAndCloseminiTool();
});
//clone

$('#cloneObj').on('click', (e: any) => {

 this.canvas.getActiveObject()?.clone().then((img:any)=>{
  this.canvas.add(img);
  img.set("top", this.activeObject.top-5);
 })

});
//save drawing
$('.bts').on('click', (e: any) => {
  this.exportCanvas();
});
//get selected target
  this.canvas.on({
    'mouse:down': (e)=> {
      console.log("mouse:down",e.target);
      if(e.target ){
        this.activeObject = e.target;
        console.log('activeObject',this.activeObject);
       // console.log('color',this.activeObject.filters);
        //refresh the color picker
       // if(this.activeObject.filters.length>0){
        //  console.log(this.activeObject.filters[0].subFilters[0].color);
          //not working
       // }
        
        if( !this.activeObject.src ){
          this.HideAndCloseminiTool();
          return;
        }

        let W = e.target.width*e.target.scaleX*0.5;
        $(".minTool").css({top: (e.target.top-25) , left: (e.target.left+W)});
        $(".minTool").show();
      }else{
        this.HideAndCloseminiTool();
      }
      
    },
    'object:moving': (e)=> {
      e.target.opacity = 0.8;
      
      //e.target.shadow = null;
      //moving limit
      let limitL:number = e.target.width*0.5;
      let limitR:number = this.canvas.getWidth() - (e.target.width * e.target.scaleX);

      let limitT:number = e.target.width*0.5;
      let limitb:number = this.canvas.getHeight() - (e.target.height * e.target.scaleY);

      if(e.target.left <limitL){e.target.left = limitL;}
      if(e.target.left >limitR){e.target.left = limitR;}

      if(e.target.top <limitT){e.target.top = limitT;}
      if(e.target.top >limitb){e.target.top = limitb;}

      //if(e.target.width * e.target.scaleX )
      console.log(e.target.width,e.target.scaleX)

      let W = e.target.width*e.target.scaleX*0.5;
      //25 because minTool height is 25
      $(".minTool").css({top: (e.target.top-25) , left: (e.target.left+W)});
      
    },
    'object:modified': function(e) {
      e.target.opacity = 1;
    },
    'object:scaling': function(e) {
      let W = e.target.width*e.target.scaleX*0.5;
      $(".minTool").css({top: (e.target.top-25) , left: (e.target.left+W)});
    }
  });


  
} 

 TintImage(hexValue:string){
  
  // only image has src ( group has no src)
  if( !this.activeObject || !this.activeObject.src){return;}
  console.log("this.activeObject -->")
  var duotoneFilter = new fabric.filters.Composed({
    subFilters: [
      //new fabric.filters.Grayscale({ mode: 'luminosity' }), // make it black and white
      new fabric.filters.BlendColor({ color: hexValue }), // apply light color
      //new fabric.filters.BlendColor({ color: '#ff0000', mode: 'lighten' }), // apply a darker color
    ]
  });

  this.activeObject.filters = [duotoneFilter];

  if(hexValue.length==0){
    //clear case
    this.activeObject.filters = null;
  }

  this.activeObject.applyFilters();
}

DragDropFromDiv(){

 
  
if(this.mobileAndTabletcheck()){
  $(".flowers").on("scroll",()=>{
    this.isScrolling = true;
  });
  $('.Fimg').on('pointerup', (e: any) => {
    if(!this.isScrolling){
     this.handleDrop(e);
    }
    }
   );
   $(".base").on("scroll",()=>{
    this.isScrolling = true;
  });
  $('.baseimg').on('pointerup', (e: any) => {
    if(!this.isScrolling){
     this.handleDrop(e);
    }
    }
   );
}else{
  const canvasContainer = $("#CC")[0];
  canvasContainer.addEventListener('dragover', this.handleDragOver, false);
  canvasContainer.addEventListener('drop', this.handleDrop.bind(this), false);
}
 

  
  $('.Fimg').on('pointerdown', (e: any) => {
    this.HideAndCloseminiTool();
   this.isScrolling = false;
   this.currentUIimage = e.target;
   let w:any = $(this.currentUIimage).width();
   let h:any = $(this.currentUIimage).height();
   if(w && h){
  this.imageOffsetX = w/2;
  this.imageOffsetY = h/2;
   }
  // e.preventDefault();
  }
);

$('.baseimg').on('pointerdown', (e: any) => {
  this.HideAndCloseminiTool();
  this.isScrolling = false;
  this.currentUIimage = e.target;
 // e.preventDefault();
 }
);



}
handleDragOver(e:any) {
  console.log('handleDragOver')
  if (e.preventDefault) {e.preventDefault();}
  e.dataTransfer.dropEffect = 'copy';
  return false;
}


handleDrop(e:any) {
  console.log('handleDrop')
  console.log(e,window.innerHeight)
  e = e;

  if (e.preventDefault) {e.preventDefault();}
  if (e.stopPropagation) {e.stopPropagation();}

  var offset = $("#canvas").offset();
  var y = 0;
  var x = 0;

  if(offset){
    y = e.clientY - (offset.top + this.imageOffsetY);
    x = e.clientX - (offset.left + this.imageOffsetX);
    /*console.log("e.clientY" ,e.clientY)
    console.log("offset.top" ,offset.top)
    console.log("imageOffsetY" ,this.imageOffsetY)*/
  }
 //console.log("drop it at" ,x,y,e.target)



  if(this.currentUIimage){this.getExistingImage(this.canvas,this.currentUIimage,x,y)}

  return false;
}



  async getExistingImage(canvas:any,element:HTMLElement,x:number,y:number) {
    this.scaleFactor = window.innerWidth/1920;
  console.log("scaleFactor", this.scaleFactor);
    console.log("e",typeof element,x,y,element)
    await fabric.FabricImage.fromObject(element).then((img:any)=>{
    //  console.log('ok now 2',img)

     /* img.scaleToWidth(32)
      img.scaleToHeight(32)
      img.scaleX=2;
      img.scaleY=2;
      */
      img.originX= 'center';
      img.originY= 'center';
      img.scaleX = this.scaleFactor;
      img.scaleY  =this.scaleFactor;

     // console.log('this.currentUIimage',this.currentUIimage);
      console.log($(this.currentUIimage).attr('class'));
      if($(this.currentUIimage).attr('class') == "baseimg"){
        //accept only one
        let _children:any = this.groupBase.getObjects();
        if(_children.length > 0){
          this.groupBase.removeAll();
         }
        
       
         //place in the
         img.left = this.canvas.getWidth()/2;
         img.top= this.canvas.getHeight()/2;
         this.groupBase.add(img);
         

      }else{
        if(this.mobileAndTabletcheck()){
          img.left = this.canvas.getWidth()/2;
          img.top= 50;
        }else{
          img.left = x;
          img.top= y;
        }
       
        this.activeObject = img;
        this.canvas.add(img);
       
      }


      canvas.renderAll();
    })
    
    //  
  }


 exportCanvas(){
 
  const dataURL = this.canvas.toDataURL({
    multiplier: 1,
    format: 'png',
    quality: 1,
    enableRetinaScaling: false
});
const link = document.createElement('a');
link.download = 'image.png';
link.href = dataURL;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}


async getImage(canvas:any,url:string) {
  this.scaleFactor = window.innerWidth/1920;
 // console.log("scaleFactor", this.scaleFactor)
  await fabric.FabricImage.fromURL(
    url,
    {crossOrigin:"anonymous"},
    { left: 20,
      top: 70,
      angle: 0,
      scaleX: this.scaleFactor,
      scaleY: this.scaleFactor,
      hasControls:false,
      hasBorders:false,
      selectable:false

     // shadow:shadow,
      //perPixelTargetFind:true,//pixelperfect
      //strokeWidth: 2,
      //stroke: "#880E4F",
     // hasBorders:false,
      /*clipPath: new fabric.Circle({ // circular mask
        radius: 32,
        originX: 'center',
        originY: 'center',
      }),*/
    }
  ).then((img:fabric.FabricImage)=>{
    canvas.add(img);
  })
}
HideAndCloseminiTool(){
  $(".minTool").hide();
  Coloris.close();
}

mobileAndTabletcheck() {
  var check = false;
  (function (a) {
      if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
          check = true;
  })(navigator.userAgent || navigator.vendor);
  return check;
}


 
  }

$(function () {
            //to accommodate different screen sizes
            const canvasHeight:any = $('#CC').height();
            //Calculate canvas width
            const canvasWidth:any =  $('#CC').width();

             new App('canvas', canvasHeight, canvasWidth);

})


/*;window.addEventListener("resize", ()=>{
  console.log('resizing');
  if(this.canvas){
    const outerCanvasContainer:any = document.getElementById('CC');
  
    const ratio          = this.canvas.getWidth() / this.canvas.getHeight();
    const containerWidth = outerCanvasContainer.clientWidth;
    const scale          = containerWidth / this.canvas.getWidth();
    const zoom           = this.canvas.getZoom() * scale;
  
    this.canvas.setDimensions({width: containerWidth, height: containerWidth / ratio});
    this.canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
    

  }, false);
    }*/