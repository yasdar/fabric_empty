import $ from "jquery";
import * as fabric from "fabric";
import {  mobileAndTabletcheck } from "./configs";





export class App
{

  canvas: fabric.Canvas; //The FabricJS Canvas object 
  //which will hold all the drawn elements
  currentUIimage:HTMLElement;
  
  imageOffsetY :number =0;
  imageOffsetX :number =0;

  groupBase:fabric.Group;

  activeObject:any=null;
  lastObject:any=null;

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



//show ave button 
//$(".bts").show();
//$(".bts").css({top: "5px" , left: "5px"});
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

 const commonSwatches=['#FFB308','#04A9DF','#A6C60D','#F8DF11','#E5075C'];
  $('.c1').on('pointerdown', (e: any) => {this.TintImage(commonSwatches[0].toString());});
  $('.c2').on('pointerdown', (e: any) => {this.TintImage(commonSwatches[1].toString());});
  $('.c3').on('pointerdown', (e: any) => {this.TintImage(commonSwatches[2].toString());});
  $('.c4').on('pointerdown', (e: any) => {this.TintImage(commonSwatches[3].toString());});
  $('.c5').on('pointerdown', (e: any) => {this.TintImage(commonSwatches[4].toString());});


//delete object
$('#removeObj').on('pointerdown', (e: any) => {
  if( !this.activeObject || !this.activeObject.src){return;}
  this.canvas.remove(this.activeObject);
  this.activeObject = null;
  this.lastObject = null;
  this.HideAndCloseminiTool();
});
//clone

$('#cloneObj').on('pointerdown', (e: any) => {

 this.canvas.getActiveObject()?.clone().then((img:any)=>{
  this.canvas.add(img);
  img.set("top", this.activeObject.top-5);
  //correct scale : scaleUp
  img.scaleX = this.scaleFactor*2;
  img.scaleY  =this.scaleFactor*2;

  this.canvas.setActiveObject(img);
  this.activeObject = img;


 });
});

 $('#rotate_Obj').on('pointerdown', (e: any) => {
  if( !this.activeObject || !this.activeObject.src){return;}
  this.collectdata('rotate')
  this.activeObject.rotate(this.activeObject.angle+90);
  this.activeObject.setCoords();
  this.canvas.renderAll();
  });


  $('#undo_Obj').on('pointerdown', (e: any) => {
    //console.log('undo 0');
   if(!this.activeObject || !this.lastObject){return;}
  console.log('action : ',this.lastObject.action);
  if(this.lastObject.action=="drag"){
    this.activeObject.top  = this.lastObject.top;
    this.activeObject.left  = this.lastObject.left;
  }
  if(this.lastObject.action == "rotate"){
    this.activeObject.rotate(this.lastObject.angle);
  }
  if(this.lastObject.action == "scale"){
    this.activeObject.scaleX  = this.lastObject.scaleX;
    this.activeObject.scaleY  = this.lastObject.scaleY;
    this.activeObject.top  = this.lastObject.top;
    this.activeObject.left  = this.lastObject.left;
  }
  if(this.lastObject.action == "tint"){
    if(this.lastObject.color){this.TintImage(this.lastObject.color);}
    else{this.TintImage('');}
  }
  this.activeObject.setCoords();
 
  this.canvas.renderAll();
    });
 


//save drawing
/*$('.bts').on('click', (e: any) => {
  this.exportCanvas();
});*/
//get selected target
  this.canvas.on({
    'mouse:up': (e)=> {

      if( this.activeObject.src ){
        //this.collectdata();
      }
    },
    'mouse:down': (e)=> {
      console.log("--->e",e);
      console.log("mouse:down",e.target);
      if(e.target ){
        this.activeObject = e.target;
        if( !this.activeObject.src ){
          this.HideAndCloseminiTool();
          return;
        }else{
          this.collectdata(e.transform?.action);
        }
        console.log('show now 1')
        $(".tool").show();

      }else{
        this.HideAndCloseminiTool();
      }
      
    },
    'object:moving': (e)=> {
      e.target.opacity = 0.8;
      
      //e.target.shadow = null;
      //moving limit
      let limitL:number = e.target.width*e.target.scaleX*0.5;
      let limitR:number = this.canvas.getWidth() - (e.target.width * e.target.scaleX*0.5);

      let limitT:number = e.target.width*e.target.scaleY*0.5;
      let limitb:number = this.canvas.getHeight() - (e.target.height * e.target.scaleY*0.5);

      if(e.target.left <limitL){e.target.left = limitL;}
      if(e.target.left >limitR){e.target.left = limitR;}

      if(e.target.top <limitT){e.target.top = limitT;}
      if(e.target.top >limitb){e.target.top = limitb;}

      
      
    },
    'object:modified': (e)=> {
      e.target.opacity = 1;
    },
    'object:scaling': (e)=> {
      
    }
  });


 


  window.addEventListener("resize", ()=>{
    console.log('resizing','isPortrait',window.innerHeight>window.innerWidth);
      this.CenterCanvas();
    }, false);
    


    this.CenterCanvas();


    //add a default base
    setTimeout(() => {
      this.currentUIimage = $('.baseimg')[0];
      this.getExistingImage(this.canvas,this.currentUIimage,10,10);
    }, 200);

    //show only bases
    this.showBases();

    $('.baseBtn').on('pointerup', (e: any) => {
      this.showBases();this.resetButtons(".baseBtn");
     });
    $('.shapeBtn').on('pointerup', (e: any) => {
      this.showShpaes();this.resetButtons(".shapeBtn");
    });
    $('.flowerBtn').on('pointerup', (e: any) => {
      this.showFlowers();this.resetButtons(".flowerBtn");
    });
    $('.ExtraBtn').on('pointerup', (e: any) => {
      console.log('ExtraBtn');this.resetButtons(".ExtraBtn");
    });
    $('.profileBtn').on('pointerup', (e: any) => {
      console.log('profileBtn');this.resetButtons(".profileBtn");
    });


    this.HideAndCloseminiTool();
} 
setcanvasColor(color:string){
  this.canvas.backgroundColor = color; 
  console.log("apply color",color)
  this.canvas.renderAll();
}
resetButtons(showonly:string){
  $('.baseBtn').removeClass('activeBt');
  $('.baseBtn').addClass('inActiveBt');
  $('.shapeBtn').removeClass('activeBt');
  $('.shapeBtn').addClass('inActiveBt');

  $('.flowerBtn').removeClass('activeBt');
  $('.flowerBtn').addClass('inActiveBt');

  $('.ExtraBtn').removeClass('activeBt');
  $('.ExtraBtn').addClass('inActiveBt');

  $('.profileBtn').removeClass('activeBt');
  $('.profileBtn').addClass('inActiveBt');


  
  $(showonly).addClass("activeBt");
  $(showonly).removeClass('inActiveBt');

}
CenterCanvas(){
  const _W:number = window.innerWidth;
  const _H:number = window.innerHeight;
  const _min:number = Math.min(_W,_H);
  const canvasWidth:any =  _min*0.8//$('#CC').width();
  let _ww:any = window.innerWidth;
  let ML = (_ww - canvasWidth) /2;

  $(".CanvasContainer").css('padding-left',ML+'px');
 
if(_W>_H && mobileAndTabletcheck()){$("#orientationDiv").show();}
else{$("#orientationDiv").hide();}

var canvas:any = document.getElementById('canvas');
const canvasW = canvas.getBoundingClientRect().width;
const canvasH = canvas.getBoundingClientRect().height;
  $("#cadre").width(canvasW*1.2);
  $("#cadre").height(canvasH*1.2);

  $("#cadre").css('margin-left',ML-(canvasW*0.1)+'px');
  $("#cadre").css('top',-canvasH*0.05+'px');
  
  //cadre
  
}
 TintImage(hexValue:string){
  
  // only image has src ( group has no src)
  if( !this.activeObject || !this.activeObject.src){return;}
 
  this.collectdata('tint');

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

  this.canvas.renderAll();
}

DragDropFromDiv(){

  $(".flowers").on("scroll",()=>{
    this.isScrolling = true;
  });
  $('.Fimg').on('pointerup', (e: any) => {
    if(!this.isScrolling){
     this.handleDrop(e);
    }
    }
   );
   $('.Simg').on('pointerup', (e: any) => {
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

 

  
  $('.Fimg').on('pointerdown', (e: any) => {this.onDown(e);});
  $('.Simg').on('pointerdown', (e: any) => {this.onDown(e);});



$('.baseimg').on('pointerdown', (e: any) => {
  this.HideAndCloseminiTool();
  this.isScrolling = false;
  this.currentUIimage = e.target;
 // e.preventDefault();
 }
);



}onDown(e:any){
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



handleDrop(e:any) {
 // console.log('handleDrop')
 // console.log(e,window.innerHeight)
  e = e;

  //if (e.preventDefault) {e.preventDefault();}
 // if (e.stopPropagation) {e.stopPropagation();}

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
 // console.log("scaleFactor", this.scaleFactor);
   // console.log("e",typeof element,x,y,element)
    await fabric.FabricImage.fromObject(element).then((img:any)=>{
   
      img.originX= 'center';
      img.originY= 'center';
      

     // console.log('voila',$(this.currentUIimage).attr('class'));
      if($(this.currentUIimage).attr('class') == "baseimg"){
        //accept only one
        let _children:any = this.groupBase.getObjects();
        if(_children.length > 0){
          this.groupBase.removeAll();
         }
        
       
         //place in the
         //console.log('scsc',img.width,this.canvas.getWidth());
         let sc = (this.canvas.getWidth()/img.width)*0.8;
         img.scaleX = sc;
         img.scaleY  =sc;

         img.left = this.canvas.getWidth()/2;
         img.top= this.canvas.getHeight()/2;
         this.groupBase.add(img);
         

      }else{

        if(mobileAndTabletcheck()){
          img.scaleX = this.scaleFactor*2;
          img.scaleY  =this.scaleFactor*2;
        }
        

     
          img.left = Math.random()*32+(this.canvas.getWidth()/2);
          img.top= this.canvas.getHeight()/2;
        
       
        this.activeObject = img;
        this.lastObject = null;

        //img.hasControls = false;
        //img.hasBorders = false;
        img.controls.ml.visible = false;
        img.controls.mb.visible = false;
        img.controls.mr.visible = false;
        img.controls.mt.visible = false;

        this.canvas.add(img);
        this.canvas.setActiveObject(img);
        $(".tool").show();
      }

    
      canvas.renderAll();
    
     
    })
    
    //  
  }
  showFlowers(){
    $('.baseimg').hide();
    $('.Simg').hide();
    $('.Fimg').show();
  }
  showBases(){
    $('.Fimg').hide();
    $('.Simg').hide();
    $('.baseimg').show();
  }
  showShpaes(){
    $('.Fimg').hide();
    $('.baseimg').hide();
    $('.Simg').show();
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

HideAndCloseminiTool(){
  console.log('hide now')
  $(".tool").hide();
}
collectdata(action:string| undefined){
  console.log('@ collect data',action);
  if(action){
    this.lastObject ={
      action : action,
  
      obj:this.activeObject,
      'scaleX':this.activeObject.scaleX,
      'scaleY':this.activeObject.scaleY,
      'top':this.activeObject.top,
      'left':this.activeObject.left,
      'angle':this.activeObject.angle
    }
    if(this.activeObject.filters){
      if(this.activeObject.filters.length>0){
        this.lastObject.color = this.activeObject.filters[0].subFilters[0].color;
      }
    }
  }
}




 
  }

$(function () {

            const _W:number = window.innerWidth;
            const _H:number = window.innerHeight;
            const _max:number = Math.max(_W,_H);
            const _min:number = Math.min(_W,_H);
            let canvasHeight:any =  _max*0.52;
            let canvasWidth:any = _min*0.8

            if(!mobileAndTabletcheck()){
              canvasHeight = window.innerHeight*0.7;
              canvasWidth = canvasHeight;
            }


            let date = Date.now();
            $.getJSON("config.json?"+date, (result)=>{
              console.log(result.data);

              const FA = new App('canvas', canvasHeight, canvasWidth);
              FA.setcanvasColor ((result.data.canvascolor).toString());

              if(!result.data.shapes){$('.shapeBtn').hide();}
              if(!result.data.flowers){$('.flowerBtn').hide();}

            });

            


        //buttons to scroll left and right
              $('#aleft').on('pointerdown', (e: any) => {
                $('#aleft').removeClass("arrowUp");
                $('#aleft').addClass("arrowDown");
             //   e.preventDefault();
                $('.base').animate({
                  scrollLeft: "-=200px"
                }, "slow");
              });

              $('#aright').on('pointerdown', (e: any) => {
                $('#aright').removeClass("arrowUp");
                $('#aright').addClass("arrowDown");
               // e.preventDefault();
                $('.base').animate({
                  scrollLeft: "+=200px"
                }, "slow");
              });

              $('#aright').on('pointerup', (e: any) => {
                $('#aright').removeClass("arrowDown");
                $('#aleft').removeClass("arrowDown");
                $('#aright').addClass("arrowUp");
                $('#aleft').addClass("arrowUp");
              });

              $('#aleft').on('pointerup', (e: any) => {
                $('#aright').removeClass("arrowDown");
                $('#aleft').removeClass("arrowDown");
                $('#aright').addClass("arrowUp");
                $('#aleft').addClass("arrowUp");
              });


})

//round base as default  -done
//portrait mode only for devices    -done
//push down the selection and make board more height   -done
//left and right arrows for flowers  -done
//fix tool positions -done
////rotate button by 90 deg  -done
//copy bug too small  -done
 // 2 versions: bases&shapes and bases&flowers  -done
//canvas color  -done
//Undo button -done : only the latest action(not sequences) of a selected object

