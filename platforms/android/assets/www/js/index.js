$(document).ready(function(e) {
///////////////////////OTORGA VALORES CSS DE JQUERY MOBILE AL MENU//////////////////////////////
  $("div:jqmData(role='panel')").css('margin-top',  ($("div:jqmData(role='header')").height()));
});

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    ///////////////////////SE AGREGAN LOS EVENTOS PROPIOS DE LA APLICACION//////////////////////////
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('backbutton', this.onBackButton, false);
    },
    onBackButton:function(){
        toast('Cargando...');
        window.location="index.html";
    },
    ///////////////////////SE INVOCA CUANDO EL DISPOSITIVO ESTA LISTO//////////////////////////////
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        getStatus();//VERIFICA EL ESTATUS DE SESION
        hayConexion();//COMPRUEBA SI HAY CONEXION
        console.log(navigator.camera);//INICIALIZA LA CAMARA
        pictureSource = navigator.camera.PictureSourceType;
        destinationType = navigator.camera.DestinationType;
        console.log(FileTransfer);//INICIALIZA LA TRANSFERENCIA DE ARCHIVOS
        ///////////////////////////LLENA EL CONTENEDOR DE PRODUCTOS///////////////////////////////
        $( "#contenedor_productos" ).html('<center><img src="img/load.gif"></center>');
        $.post( "http://dotredes.dyndns.biz/ticsfix/control/select_producto.php",{},function(data){
            $( "#contenedor_productos" ).html(data);
            $( ".colapsibles" ).collapsible();
        });
        ///////////////////////////LLENA EL CONTENEDOR DE SERVICIOS///////////////////////////////
        $( "#contenedor_servicios" ).html('<center><img src="img/load.gif"></center>');
        $.post( "http://dotredes.dyndns.biz/ticsfix/control/select_servicio.php",{},function(data){
             $( "#contenedor_servicios" ).html(data);
             $( ".colapsibles" ).collapsible();
        });
        ///////////////////////////LLENA EL CONTENEDOR DE HISTORIAL SERVICIOS///////////////////////////////
                $( "#contenedor_historial_servicios" ).html('<center><img src="img/load.gif"></center>');
                $.post( "http://dotredes.dyndns.biz/ticsfix/control/select_historial_servicio.php",{
                id_cliente:window.localStorage.getItem('id_cliente')
                },function(data){
                     $( "#contenedor_historial_servicios" ).html(data);
                     $( ".colapsibles" ).collapsible();
                });
        ///////////////////////////LLENA EL CONTENEDOR DE HISTORIAL PRODUCTOS///////////////////////////////
                        $( "#contenedor_historial_productos" ).html('<center><img src="img/load.gif"></center>');
                        $.post( "http://dotredes.dyndns.biz/ticsfix/control/select_historial_producto.php",{
                        id_cliente:window.localStorage.getItem('id_cliente')
                        },function(data){
                             $( "#contenedor_historial_productos" ).html(data);
                             $( ".colapsibles" ).collapsible();
                        });
        //////////////////////////MENSAJES PUSH////////////////////////////////////////////////////
        var pusher = new Pusher('c4f9556f04b37778032e');
            var channel = pusher.subscribe('canal_notificacion');
            channel.bind('evento_notificacion', function(data) {
              notificar(data.titulo,data.texto);
            });
            var channel = pusher.subscribe('canal_notificacion');
                        channel.bind('evento_notificacion_'+window.localStorage.getItem('id_cliente'), function(data) {
                          notificar(data.titulo,data.texto);
                        });

    },
    ///////////////////////ACTUALIZA EL DOM CUANDO SE RECIVE UN EVENTO//////////////////////////////
    receivedEvent: function(id) {
    console.log('Received Event: ' + id);
    ////////////////////////////INICIALIZA LA API DE PayPal///////////////////////////////////////
       app.initPaymentUI();
    },
    /////////////////////////////FUNCIONES DE PAYPAL//////////////////////////////////////////////
    initPaymentUI : function () {
         var clientIDs = {
           "PayPalEnvironmentProduction": "",
           "PayPalEnvironmentSandbox": ""
         };
         PayPalMobile.init(clientIDs, app.onPayPalMobileInit);

       },
       onSuccesfulPayment : function(payment) {
         console.log("payment success: " + JSON.stringify(payment, null, 4));
         ////////////////////////////////////////////////////////////////////
         /////////////ENVIAR EMAIL CON DATOS DE payment//////////////////////
         ////////////////////////////////////////////////////////////////////
         ////////////Validar si fue orden de servicio o compra///////////////
         switch(window.localStorage.getItem('tipo_orden'))
         {
            //CREAR ACCION AJAX MIENTRAS SE PROCESA
            case 'servicio':
                window.localStorage.setItem('referencia',payment.response.id);
                alert("Al aceptar se abrirá la camara del móvil.\nPor favor tome una foto referente a su problemática.");
                subirFoto();
            break;
            case 'producto':
                 var comentarios=prompt("¿Desea agregar algún comentario sobre esta orden?");
                 $.post("http://dotredes.dyndns.biz/ticsfix/control/procesar_orden_producto.php",
                 {
                    id_producto:window.localStorage.getItem('id_producto'),
                    id_cliente:window.localStorage.getItem('id_cliente'),
                    referencia:payment.response.id,
                    comentarios:comentarios
                 },
                 function(data){
                    swal({title:"Solicitud en proseso",text:"Le notificaremos por Email en cuanto su orden se encuentre en camino, así mismo podrá verificar la ruta del empleado que le asistirá en la parte de historial.\nSi tiene alguna duda puede comunicarse con nosotros a los medios q se encuentra en la parte de contacto"},compartir);
                 });
            break;
         }
       },
       onAuthorizationCallback : function(authorization) {
         console.log("authorization: " + JSON.stringify(authorization, null, 4));
       },
       createPayment : function (json,caso) {
           switch(caso){
                case 's':
                    var paymentDetails = new PayPalPaymentDetails(json.precio, "0.00", "0.00");
                    var payment = new PayPalPayment(json.precio, "MXN",json.servicio, "Sale", paymentDetails);
                    return payment;
                break;
                case 'p':
                    var paymentDetails = new PayPalPaymentDetails(json.precio, "0.00", "0.00");
                    var payment = new PayPalPayment(json.precio, "MXN",json.producto, "Sale", paymentDetails);
                    return payment;
                break;
           }

       },
       configuration : function () {
         // for more options see `paypal-mobile-js-helper.js`
         var config = new PayPalConfiguration(
         {merchantName: "ticsfix",
         merchantPrivacyPolicyURL: "",
         merchantUserAgreementURL: "",
         forceDefaultsInSandbox:true
         }
         );
         return config;
       },
       onPrepareRender : function() {},
       onPayPalMobileInit : function() {
         // must be called
         //////////////////// PayPalEnvironmentNoNetwork  crea un entorno de prueba/////////////////
         PayPalMobile.prepareToRender("PayPalEnvironmentProduction", app.configuration(), app.onPrepareRender);
       },
       onUserCanceled : function(result) {
         console.log(result);
       }
    ///////////////////////////////////FIN API PayPal///////////////////////////////////////////////
    };

/////////////////////////////////////INICIALIZA LA APLICACION///////////////////////////////////////
app.initialize();
//////////////////////////////////////INICIA SESION EN FACEBOOK/////////////////////////////////////
function conectar(){
facebookConnectPlugin.login(['email'],conectado,noConectado);
}
//////////////////////////////////////CIERRA SESION EN FACEBOOK/////////////////////////////////////
function desconectar(){
if(confirm('Está a punto de eliminar sus datos de este dispositivo, puede iniciar sesión de nuevo cuando guste.\n¿Realmente desea salir?'))
facebookConnectPlugin.logout(noConectado,conectado);
}
//////////////////////////////////////VALIDA CONEXION Y CREA VARIABLES DE SESION/////////////////////
function conectado(data){
facebookConnectPlugin.api("/me?fields=id,name,email", ['email'],
function (result) {
console.log("Al iniciar sesion el id es: "+result.id);
//configurando el item de nombre de usuario
$("#li_facebook").html('<a href="#" class="panel_li" id="a_facebook"><img src="http://graph.facebook.com/'+result.id+'/picture?type=large" width="40"> '+result.name+' </a>');
$("#li_historial").html('<a href="#" class="panel_li" onclick="historial();" style="color:black;"><span class="icon-book"></span> Historial</a>');
$("#li_config").html('<a href="#" class="panel_li" onclick="configuracion();" style="color:black;"><span class="icon-cog"></span> CONFIGURACIÓN</a>');
$("#li_compartir").html('<a href="#" class="panel_li" onclick="compartir();" style="color:black;"><span class="icon-share2"></span> Compartir</a>');
//seteando variables de sesión
window.localStorage.setItem("nombre_usuario", result.name);
window.localStorage.setItem("email", result.email);
//almacenando al usuario en la base
$.post("http://dotredes.dyndns.biz/ticsfix/control/insert_cliente.php",{
id_facebook:result.id,
nombre_usuario:result.name,
email:result.email
},function(data){
window.localStorage.setItem("id_cliente", data);
console.log("El id del cliente es: "+data)
});
//colocando el item para configurar los datos
$("#li_config").html('<a href="#" class="panel_li" onclick="configuracion();" style="color:black;"><span class="icon-cog"></span> CONFIGURACIÓN</a>');
compartir();
$("#li_compartir").html('<a href="#" class="panel_li" onclick="compartir();" style="color:black;"><span class="icon-share2"></span> Compartir</a>');
},
function (error) {
//error
});
}
//////////////////////////////////////CALLBACK DE DESCONEXION////////////////////////////////////////
function noConectado(){
window.location="index.html";
window.localStorage.clear();
}
//////////////////////////////////////COMPARTIR PUBLICACION////////////////////////////////////////
function compartir(){
if(hayConexion()){
if(window.localStorage.getItem('id_cliente')!=null){
facebookConnectPlugin.showDialog(
    {
        method: "feed",
        name:'Tics.PRO',
        link:'http://tics.pro/',
        caption: 'Soluciones creativas a necesidades reales; Estamos aquí para ayudarte.',
        description: 'Nuestro Servicio de soporte técnico a domicilio y remoto asiste a nuestros clientes en problemas que se le presenten con sus PC s, laptops, dispositivos móviles, servidores, impresoras, aplicaciones de software y conexiones de red.',
        message:'Descarga la app',
        picture:'http://tics.pro/wp-content/uploads/2015/11/logo256.png'

    },
    function (response) { toast('Gracias por compartir'); },
    function (response) { console.log("Compartir cancelado"); });
    }else{ toast('No has iniciado sesión'); }
   }
}
//////////////////////////////////////VALIDA INICIO DE SESION FACEBOOK//////////////////////////////
function getStatus(){
var estatus =false;
facebookConnectPlugin.getLoginStatus(function(data){
if(data.status=='connected'){
facebookConnectPlugin.api("/me?fields=id,name,email", ['email'],
function (result) {
$("#li_facebook").html('<a href="#" class="panel_li" id="a_facebook"><img src="http://graph.facebook.com/'+result.id+'/picture?type=large" width="40"> '+result.name+' </a>');
$("#li_historial").html('<a href="#" class="panel_li" onclick="historial();" style="color:black;"><span class="icon-book"></span> Historial</a>');
$("#li_config").html('<a href="#" class="panel_li" onclick="configuracion();" style="color:black;"><span class="icon-cog"></span> CONFIGURACIÓN</a>');
$("#li_compartir").html('<a href="#" class="panel_li" onclick="compartir();" style="color:black;"><span class="icon-share2"></span> Compartir</a>');
},
function (error) {
alert("Failed: " + JSON.stringify(error));
});
}
},function(data){
});
}
//////////////////////////////////////VALIDA CONEXIóN////////////////////////////////////////
function hayConexion() {
    var networkState = navigator.connection.type;
        var states = {};
        states[Connection.UNKNOWN]  = 'Unknown connection';
        states[Connection.ETHERNET] = 'Ethernet connection';
        states[Connection.WIFI]     = 'WiFi connection';
        states[Connection.CELL_2G]  = 'Cell 2G connection';
        states[Connection.CELL_3G]  = 'Cell 3G connection';
        states[Connection.CELL_4G]  = 'Cell 4G connection';
        states[Connection.CELL]     = 'Cell generic connection';
        states[Connection.NONE]     = 'No network connection';
    if(states[networkState]=='No network connection')
    {
        toast("Esta aplicación requiere una conexión activa. Porfavor verifica tu conexión");
        return false;
    }else
    {
        return true;
    }
}
//////////////////////////////////////CARGAR INICIO////////////////////////////////////////
function inicio(){
toast('Cargando...');
window.location="index.html";
}
//////////////////////////////////////CARGAR SERVICIOS////////////////////////////////////////
function servicios(){
toast('Cargando...');
if(hayConexion())window.location="servicios.html";
}
//////////////////////////////////////CARGAR DETALLE SERVICIOS////////////////////////////////////////
function detalleServicio(id_servicio){
toast('Cargando...');
window.localStorage.setItem('detalle_servicio',id_servicio);
if(hayConexion())window.location="detalle_servicio.html";
}
//////////////////////////////////////CARGAR PRODUCTOS////////////////////////////////////////
function productos(){
toast('Cargando...');
if(hayConexion())window.location="productos.html";
}
//////////////////////////////////////CARGAR HISTORIAL////////////////////////////////////////
function historial(){
toast('Cargando...');
if(hayConexion()){
if(window.localStorage.getItem('id_cliente')!=null){
window.location="historial.html";
}else{ toast('No has iniciado sesión'); }
}
}
//////////////////////////////////////CARGAR DETALLE HISTORIAL////////////////////////////////////////
function detalleHistorial(id_orden_servicio){
toast('Cargando...');
window.localStorage.setItem('detalle_historial',id_orden_servicio);
if(hayConexion())window.location="detalle_historial.html";
}
//////////////////////////////////////CARGAR CONTACTO////////////////////////////////////////
function contacto(){
toast('Cargando...');
window.location="contacto.html";
}
//////////////////////////////////////CARGAR AYUDA////////////////////////////////////////
function ayuda(){
toast('Cargando...');
window.location="ayuda.html";
}
//////////////////////////////////////CARGAR CONFIGURACION////////////////////////////////////////
function configuracion()
{
toast('Cargando...');
if(hayConexion)window.location="configuracion.html";
}
//////////////////////////////////////CARGAR REPORTAR////////////////////////////////////////
function reportar()
{
toast('Cargando...');
if(hayConexion)window.location="reportar.html";
}
//////////////////////////////////////CARGAR TERMINOS Y CONDICIONES////////////////////////////////////////
function terminos()
{
toast('Estamos trabajando para ofrecerte el mejor servicio');
//if(hayConexion)window.location=".html";
}
//////////////////////////////////OBTENER Y ACTUALIZAR GEOLOCALIZACION//////////////////////////////
function getLocation(location){
toast('Cargando...');
$.post("http://dotredes.dyndns.biz:/ticsfix/control/update_location.php",
{
id_cliente:window.localStorage.getItem("id_cliente"),
lat:location.coords.latitude,
lon:location.coords.longitude
},function(data){
console.log(data);
var map;
var punto = new google.maps.LatLng(location.coords.latitude,location.coords.longitude);
   var myOptions = {
     zoom: 18, //nivel de zoom para poder ver de cerca.
     center: punto,
     mapTypeId: google.maps.MapTypeId.ROADMAP
   }
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

    var marcador = new google.maps.Marker({
      position:punto,
      map:map,
      animation:google.maps.Animation.DROP,
      draggable:false
     });

     map.addListener('click', function(e) {
         marcador.setPosition(e.latLng);
         $.post("http://dotredes.dyndns.biz:/ticsfix/control/update_location.php",{
            id_cliente:window.localStorage.getItem("id_cliente"),
            lat:marcador.getPosition().lat(),
            lon:marcador.getPosition().lng()
         },function(data){});
      });
});
}
//////////////////////////////////////ACTUALIZAR DATOS DEL CLIENTE//////////////////////////////////
function actualizarDatos(){
var nombre_cliente=$("#nombre_cliente").prop('value');
var telefono=$("#telefono").prop('value');
var entidad=$("#entidad").prop('value');
var direccion=$("#direccion").prop('value');
if(nombre_cliente.length<=0||telefono.length<=0||direccion.length<=0){
    toast("Todos los campos son requeridos");
}else{
    $.post("http://dotredes.dyndns.biz:/ticsfix/control/update_cliente.php",{
    id_cliente:window.localStorage.getItem("id_cliente"),
    nombre_cliente:nombre_cliente,
    telefono:telefono,
    entidad:entidad,
    direccion:direccion
    },function(data){
        toast("Sus datos se han actualizado con éxito");
    });
}

}
//////////////////////////////////////ORDENAR////////////////////////////////////////
function ordenar_p(id_producto){
if(window.localStorage.getItem("id_cliente")!=null){//Valida que el cliente haya iniciado sesión primero

  $.post("http://dotredes.dyndns.biz:/ticsfix/control/get_cliente.php",{//valida que el cliente haya llenado todos sus datos
  id_cliente:window.localStorage.getItem("id_cliente")
  },function(data){
    var cliente=$.parseJSON(data);
    console.log(JSON.stringify(data));
        if(cliente.nombre_cliente.length<=0 || cliente.telefono==0 || cliente.direccion.lenght <=0){
            swal({
                title:"Mensaje",
                text:"Aún no ha configurado sus datos personales\n¿Desea configurar sus datos ahora?",
                showCancelButton:true,
                confirmButtonText:"Configurar",
                closeOnConfirm: true
            },
             configuracion
            );
        }else{
            $.post("http://dotredes.dyndns.biz:/ticsfix/control/get_producto.php",{id_producto:id_producto},function(data){
            var json=$.parseJSON(data);
            window.localStorage.setItem("tipo_orden","producto");
            window.localStorage.setItem("id_producto",id_producto);
            PayPalMobile.renderSinglePaymentUI(app.createPayment(json,'p'), app.onSuccesfulPayment, app.onUserCanceled);
            });
        }
    });
}else{
swal("Mensaje","Debe iniciar sesión primero para poder ordenar");
}
}
function ordenar_s(id_servicio){
if(window.localStorage.getItem("id_cliente")!=null){//Valida que el cliente haya iniciado sesión primero

  $.post("http://dotredes.dyndns.biz:/ticsfix/control/get_cliente.php",{//valida que el cliente haya llenado todos sus datos
  id_cliente:window.localStorage.getItem("id_cliente")
  },function(data){
    var cliente=$.parseJSON(data);
    console.log(JSON.stringify(data));
        if(cliente.nombre_cliente.length<=0 || cliente.telefono==0 || cliente.direccion.lenght <=0){
            swal({
                title:"Mensaje",
                text:"Aún no ha configurado sus datos personales\n¿Desea configurar sus datos ahora?",
                showCancelButton:true,
                confirmButtonText:"Configurar",
                closeOnConfirm: true
            },
             configuracion
            );
        }else{
            //Validar que se haya seleccionado fecha y hora
            var fechaServicio = $("#fecha_"+id_servicio).prop('value');
            var horaServicio = $("#hora_"+id_servicio).prop('value');
            if(fechaServicio.length <= 0 || horaServicio.length <= 0){
                toast('Debes seleccionar una fecha y hora válidas');
            }else{
                $.post("http://dotredes.dyndns.biz:/ticsfix/control/get_servicio.php",{id_servicio:id_servicio},function(data){
                var json=$.parseJSON(data);
                window.localStorage.setItem("tipo_orden","servicio");
                window.localStorage.setItem("id_servicio",id_servicio);
                window.localStorage.setItem("fecha",fechaServicio);
                window.localStorage.setItem("hora",horaServicio);
                PayPalMobile.renderSinglePaymentUI(app.createPayment(json,'s'), app.onSuccesfulPayment, app.onUserCanceled);
                });
            }
        }
    });
}else{
toast("Debe iniciar sesión primero para poder ordenar");
}
}
////////////////////////////////////FUNCIONES DE LA CAMARA//////////////////////////////////////////
var pictureSource;   // picture source
var destinationType; // sets the format of returned value
///////////////////////////////////////ABRE LA CAMARA///////////////////////////////////////////////
function subirFoto() {

    navigator.camera.getPicture(onCapturePhoto, onFail, {
        quality: 20,
        destinationType: destinationType.FILE_URI
    });
}
//////////////////////////////////CALLBACK EN CASO DE ERROR/////////////////////////////////////////
function onFail(message) {
    if(message=='Camera cancelled.'){
    alert("Por favor tome una foto referente a la problemática");
    subirFoto();
    }else{
        alert('Ha ocurrido el siguiente error:' + message);
    }

}


//LIMPIA REGiSTRO DE LA FOTO
function clearCache() {
    navigator.camera.cleanup();
}
////////////////////////CALLBACK EN CASO DE QUE LA FOTO SE HAYA TOMADO//////////////////////////////
var retries = 0;
function onCapturePhoto(fileURI) {
    ////////////CALLBACK FOTO SUBIDA CON EXITO////////////
    var win = function (r) {
        clearCache();
        retries = 0;
        swal({title:"Solicitud en proseso",text:"Le notificaremos por Email en cuanto su orden se encuentre en camino, así mismo podrá verificar la ruta del técnico que le asistirá en la parte de historial.\nSi tiene alguna duda puede comunicarse con nosotros a los medios q se encuentra en la parte de contacto"},compartir);

    }
    ////////////CALLBACK SI OCURRIO ERROR AL SUBIR FOTO////////////
    var fail = function (error) {
        if (retries == 0) {
            retries ++
            setTimeout(function() {
                onCapturePhoto(fileURI)
            }, 1000)
        } else {
            retries = 0;
            clearCache();
            alert('Ups. Something wrong happens!');
        }
    }
    /////////////OPCIONES DE TRANSFERENCIA AL SERVIDOR//////////////
    var options = new FileUploadOptions();
    options.fileKey = "imagen";
    options.fileName = fileURI.substr(fileURI.lastIndexOf('/') + 1);
    options.mimeType = "image/jpeg";
    //////////////INSERSION A LA BASE///////////////////////////////
   var problematica='';
    problematica=prompt("Describa la problemática");
    while(problematica == null || problematica.length<=0){
    alert("El campo no debe estar vacio");
    problematica=prompt("Describa la problemática");
    }
    /////////Ya teniendo la problematica se envia a la base/////////////////
    $.post("http://dotredes.dyndns.biz/ticsfix/control/procesar_orden_servicio.php",{
    id_servicio:window.localStorage.getItem('id_servicio'),
    id_cliente:window.localStorage.getItem('id_cliente'),
    referencia:window.localStorage.getItem('referencia'),
    fecha:window.localStorage.getItem('fecha'),
    hora:window.localStorage.getItem('hora'),
    problematica:problematica
    },function(data){
        console.log("id generado :"+data);
       var params = new Object();
       params.id_orden_servicio = data;
       options.params = params;
       toast("La imagen se está procesando...");
       var ft = new FileTransfer();
       ft.upload(fileURI, encodeURI("http://dotredes.dyndns.biz/ticsfix/control/insert_imagen_cliente.php"),win, fail, options);
    });
}
function notificar(titulo,mensaje){
window.MainActivity.Notify(titulo,mensaje);
var src='/android_asset/www/notificacion.ogg';
var media = new Media(src, function(){},function(e){alert(e.message);});
media.play();
}

function validaFecha(id_fecha){
var fecha = $("#"+id_fecha).prop('value');
var hoy = "";
$.post('http://dotredes.dyndns.biz/ticsfix/control/get_fecha.php',{},function(data){
hoy=data;

if(validate_fechaMayorQue(fecha,hoy)){
    toast("La fecha seleccionada no es válida");
    $("#"+id_fecha).prop('value','');
}else{

}
});

}
function validate_fechaMayorQue(fechaInicial,fechaFinal)
{
valuesStart=fechaInicial.split("-");
valuesEnd=fechaFinal.split("-");
 // Verificamos que la fecha no sea posterior a la actual
var dateStart=new Date(valuesStart[0],valuesStart[1],valuesStart[2]);
var dateEnd=new Date(valuesEnd[0],valuesEnd[1],valuesEnd[2]);
if(dateStart >= dateEnd)
{
return 0;
}
return 1;
}
function validaHora(id_hora){
    var hora =$("#"+id_hora).prop('value');
    var validacion = hora[0]+hora[1];
    if(validacion >=09 && validacion <= 21){

    }else{
        toast("La hora seleccionada no es válida");
        $("#"+id_hora).prop('value','');
    }
}
function verUbicacion(id_empleado){
toast('Cargando...');
window.localStorage.setItem('id_empleado',id_empleado);
if(hayConexion())window.open("mapa.html");
}

function toast(texto){
window.plugins.toast.show(texto, 'short', 'center',
function(a){console.log('toast success: ' + a)},
function(b){console.log('toast error: ' + b)});
}