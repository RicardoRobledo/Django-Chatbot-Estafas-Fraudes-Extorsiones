//const base_url = 'http://127.0.0.1:8000/';
const base_url = 'https://django-chatbot-estafas-fraudes.onrender.com/';
const assistant_name = 'Asistente preventor de fraudes y extorsiones';
const welcome_message = 'Saludos, para poder ayudarte primero necesito que me proveas de algunos datos.';
let id_mensaje = 0;
const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

const md = window.markdownit();

const signal = new AbortController().signal;

let audio = null;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();


// --------------------------------------------------
//                    functions
// --------------------------------------------------

function format_chatbot_message(id) {

  const chatbotMessage = `
  <div class='chatbot-message col-12 py-4 d-flex justify-content-center' id='${id}' style='display:none;'>
      <div class='d-flex col-8' id='chatbot-message-content'>
          <img src='/static/imgs/chatbot.jpeg' width='60' height='60' class='chatbot-img'>
          <div class='m-2'>
              <h6>${assistant_name}</h6>
              <div class='container-animacion'>
                <div class='cargando'>
                  <div class='pelotas'></div>
                  <div class='pelotas'></div>
                  <div class='pelotas'></div>
                </div>
              </div>
          </div>
      </div>
  </div>`;

  return chatbotMessage;

}


function format_user_message(message) {

  const userMessage = `
  <div class='user-message col-12 py-4 d-flex justify-content-center'>
      <div class='d-flex col-8' id='user-message-content'>
          <img src='/static/imgs/admin.png' width='60' height='60' class='user-img'>
          <div class='m-2'>
              <h6>Tú</h6>
              <p>${message}</p>
          </div>
      </div>
  </div>`;

  return userMessage;

}


function setUpSpeechRecognition() {

  // Configuración de Speech Recognition
  recognition.lang = 'es-ES'; // Configurar el idioma
  recognition.interimResults = false; // Mostrar resultados intermedios
  recognition.maxAlternatives = 1; // Número máximo de resultados alternativos
  recognition.continuous = true;

  // Eventos de reconocimiento
  recognition.onstart = () => {
    $('#btn-play-speaker').hide();
  };

  recognition.onresult = async (event) => {

    recognition.stop();
    let userMessage = event.results[0][0].transcript;

    // getting identifier to add in chatbot message
    const id = 'container-chatbot-message-' + id_mensaje++;
    const formattedChatbotMessage = format_chatbot_message(id);
    const formattedUserMessage = format_user_message(userMessage);

    // adding messages to conversation
    $('.conversation').append(formattedUserMessage);
    $('.conversation').append(formattedChatbotMessage);

    $('.container-animacion').remove();
    $(`#${id}`).fadeIn();

    // sending message to chatbot
    const url = base_url + 'chatbot/message/voice/';
    const response = await send_message(url, id, userMessage, signal);

  };

  recognition.onspeechend = () => {

  };

  recognition.onerror = (event) => {
    recognition.stop();

    if (event.error === 'no-speech') {
      $('#btn-play-speaker').show();
      $('#btn-stop-speaker').hide();
    }
  };

}


function reproduceSpeaker(voiceResponse) {

  $('#btn-stop-speaker').show();
  $('.chatbot-img-container').css({'border':'8px solid rgb(24, 177, 70)', 'border-radius':'50%'});

  const audioBinario = atob(voiceResponse);

  const arrayBuffer = new ArrayBuffer(audioBinario.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < audioBinario.length; i++) {
    uint8Array[i] = audioBinario.charCodeAt(i);
  }

  const blob = new Blob([uint8Array], { type: 'audio/wav' });
  const audioUrl = URL.createObjectURL(blob);
  audio = new Audio(audioUrl);
  audio.play();

  audio.onended = function() {
    $('#btn-play-speaker').show();
    $('#btn-stop-speaker').hide();
    $('.chatbot-img-container').css({'border':'', 'border-radius':''});
  };

}


function playSpeaker() {

  recognition.start();

}


function cancelSpeaker() {

  $('.chatbot-speaker').remove();
  $('#initial-cards-container').hide();
  $('section').show();
  recognition.stop();
  window.scrollTo(0, document.documentElement.scrollHeight);

  stopAudio();
  
};


function stopSpeaker() {

  $('#btn-play-speaker').show();
  $('#btn-stop-speaker').hide();
  $('.chatbot-img-container').css({'border':'', 'border-radius':''});
  
  stopAudio();

};


function stopAudio(){

  if (audio) {
    audio.pause();
    audio = null;
  }

}


function disable_form_message() {
  $('#btn-detener').show();
  $('#btn-enviar').hide();
  $('#btn-microphone').hide();
  $('#input-message').prop('disabled', true);
}


function enable_form_message() {
  let send_button = $('#btn-enviar');
  send_button.css('color', '#000000');
  send_button.css('background-color', '#c5c5c5');
  send_button.prop('disabled', true);
  send_button.show();
  $('#btn-detener').hide();
  $('#input-message').prop('disabled', false);
  $('#btn-microphone').show();
}


async function initialize() {

  let send_button = $('#btn-enviar');
  send_button.css('background-color', '#c5c5c5');
  send_button.css('color', '#000000');
  send_button.prop('disabled', true);
  $('.chatbot-speaker').hide();
  $('#input-message').prop('disabled', true);
  disable_form_message();
  setUpSpeechRecognition();
  $('#btn-detener').hide();
}


function get_message() {
  const message = $('#input-message').val();
  $('#input-message').val('');
  return message;
}


async function send_message(url, id, user_message, signal) {

  const thread_id = localStorage.getItem('thread_id');

  const response = await fetch(url, {
    signal: signal,
    method: 'POST',
    mode: 'same-origin',
    headers: {
      'X-CSRFToken': csrftoken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ thread_id, user_message })
  }).then(async (response) => {

    if (response.status === 402) {
      throw new PaymentRequiredError('Error, se ha alcanzado alcanzado el límite de saldo');
    } else {
      return response.json();
    }

  }).then(
    async (data) => {

      const msg = data['msg'];

      if ('voice_response' in data) {

        voiceResponse = data['voice_response']
        reproduceSpeaker(voiceResponse);

        resultHtml = md.render(msg);
        $(`#${id} .m-2`).append(resultHtml);

      } else{

        resultHtml = md.render(msg);
        $(`#${id} .m-2`).append(resultHtml);

      }

    }
  ).catch(error => {

    if (error.name === 'AbortError') {
      $(`#${id} .m-2 p`).append('<h7 class="text-secondary">Mensaje detenido<h7>');
    } else if (error.name === 'PaymentRequiredError') {
      $(`#${id} .m-2 p`).append('<h7 class="text-danger">Error, el límite de cuota ha sido alcanzado, por favor verifique su crédito<h7>');
    } else {
      $(`#${id} .m-2 p`).append('<h7 class="text-danger">Hubo un error en el mensaje<h7>');
    }

  });

  return response;
}


async function create_conversation_thread(name) {

  const response = await fetch(base_url + 'chatbot/thread_id/', {

    method: 'POST',
    mode: 'same-origin',
    headers: {
      'X-CSRFToken': csrftoken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name })

  }).then(async (response) => {

    if (response.status === 200) {
      return response.json();
    }

  }).then(async (data) => {

    $('#btn-enviar').fadeIn(900)
    $('#input-message').show(900);
    $('#form-user-data').show();
    $('#initial-cards-container').fadeIn(900);

    return data;

  });

  localStorage.setItem('thread_id', response['thread_id']);

}


async function delete_conversation_thread() {

  if (localStorage.getItem('thread_id') !== null) {

    var requestOptions = {
      method: 'POST',
      mode: 'same-origin',
      headers: {
        'X-CSRFToken': csrftoken,
        'Content-Type': 'application/json',
      }
    };

    const thread_url = base_url + 'chatbot/thread_id/' + localStorage.getItem('thread_id') + '/'
    navigator.sendBeacon(thread_url, requestOptions);

    localStorage.removeItem('thread_id');

  }

}


async function generatePDF() {

  let retrievedData = JSON.parse(localStorage.getItem('userData'));
  let conversation = '';

  // Select all messages in the conversation
  $('.conversation').find('.chatbot-message, .user-message').each(function() {
      // Get sender and message text
      let sender = $(this).find('h6').text();
      let message = $(this).find('p').text();

      // Concat sender and message text
      conversation += sender + '\n' + message + '\n\n';
  });

  conversation = conversation.trim();

  const response = await fetch(base_url + 'chatbot/evaluate/', {

    method: 'POST',
    mode: 'same-origin',
    headers: {
      'X-CSRFToken': csrftoken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ conversation })

  }).then(async (response) => {

    if (response.status === 200) {
      return response.json();
    }

  }).then(async (data) => {

    return data['msg'];

  });

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.width;

  // Function to add wrapped text
  function addWrappedText(text, x, y, maxWidth, lineHeight) {
    const lines = doc.splitTextToSize(text, maxWidth);
    for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], x, y + (i * lineHeight));
    }
    return lines.length;
  }


  doc.setFontSize(16);
  doc.text("Datos del usuario", 10, 10);

  doc.setFontSize(12);
  let yPosition = 20;
  const lineHeight = 7;
  const maxWidth = pageWidth - 20; // 10px margin on each side

  // Add user data with text wrapping
  yPosition += addWrappedText(`Nombre: ${retrievedData.name}`, 10, yPosition, maxWidth, lineHeight) * lineHeight;
  yPosition += addWrappedText(`Apellido paterno: ${retrievedData.middleName}`, 10, yPosition, maxWidth, lineHeight) * lineHeight;
  yPosition += addWrappedText(`Apellido materno: ${retrievedData.lastName}`, 10, yPosition, maxWidth, lineHeight) * lineHeight;
  yPosition += addWrappedText(`Correo: ${retrievedData.email}`, 10, yPosition, maxWidth, lineHeight) * lineHeight;

  // Add some space before the advice section
  yPosition += 10;

  // Add advice with text wrapping
  const adviceLines = addWrappedText(`Consejos y pasos posteriores: ${response}`, 10, yPosition, maxWidth, lineHeight);

  doc.save('conversation_data.pdf');
}


// --------------------------------------------------
//                      events
// --------------------------------------------------

$('#input-message').on('keyup', function (event) {

  let text = $(this).val();
  let button = $('#btn-enviar');

  if (text.trim() === "") {
    button.css('color', '#000000');
    button.css('background-color', '#c5c5c5');
    button.prop('disabled', true);
  } else {
    if (event.keyCode === 13) {
      button.trigger('click');
    }

    button.css('color', '#ffffff');
    button.css('background-color', '#007bff');
    button.prop('disabled', false);
  }

});


$('#confirm-button').click(async function (event) {

  event.preventDefault();

  let name = $('#name').val();
  let middleName = $('#middle-name').val();
  let lastName = $('#last-name').val();
  let email = $('#email').val();

  // Regular expressions for validation
  let textRegex = /^[a-zA-Z\s]+$/; // Solo letras y espacios
  let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Formato de correo

  let isValid = true;
  let errorMessage = '';

  // Validar nombre
  if (!textRegex.test(name)) {
      isValid = false;
      errorMessage += 'El nombre solo debe contener letras y espacios.\n';
  }

  // Validar segundo nombre
  if (!textRegex.test(middleName)) {
      isValid = false;
      errorMessage += 'El apellido paterno solo debe contener letras y espacios.\n';
  }

  // Validar apellido
  if (!textRegex.test(lastName)) {
      isValid = false;
      errorMessage += 'El apellido materno solo debe contener letras y espacios.\n';
  }

  // Validar correo electrónico
  if (!emailRegex.test(email)) {
      isValid = false;
      errorMessage += 'El correo electrónico no es válido.\n';
  }

  if (isValid) {
      let userData = {
          name: name,
          middleName: middleName,
          lastName: lastName,
          email: email
      };

      localStorage.setItem('userData', JSON.stringify(userData));

      create_conversation_thread(name);

      $('#form-user-data').remove();
      $('#message-container p').hide();
      $('#success-badge').fadeIn(900);

      enable_form_message();

  } else {
      alert(errorMessage); // Muestra los errores en un alert
  }

});


$('#btn-logout').click(async function (event) {

  await delete_conversation_thread();
  window.location.href = '/authentication/login/';

});


$('#btn-enviar').on('click', async function () {

  $('#initial-cards-container').hide();
  disable_form_message();
  const userMessage = get_message();

  // getting identifier to add in chatbot message
  const id = 'container-chatbot-message-' + id_mensaje++;
  const formattedChatbotMessage = format_chatbot_message(id);
  const formattedUserMessage = format_user_message(userMessage);

  // adding messages to conversation
  $('.conversation').append(formattedUserMessage);
  $('.conversation').append(formattedChatbotMessage);

  window.scrollTo(0, document.documentElement.scrollHeight);

  // sending message to chatbot
  const message_url = base_url + 'chatbot/message/';
  const response = await send_message(message_url, id, userMessage, signal);

  $('.container-animacion').remove();
  $(`#${id}`).fadeIn();

  window.scrollTo(0, document.documentElement.scrollHeight);

  enable_form_message();

});


$('#btn-detener').on('click', function () {
  enable_form_message();
  if (controller) {
    controller.abort(); // Se llama al método abort() del controlador para cancelar la petición
    console.log('Petición cancelada');
  }
});


$('#btn-microphone').on('click', function () {

  $('section').hide();
  $('#contenido').append(`
    <div class='chatbot-speaker d-flex flex-column justify-content-center align-items-center mt-5'>
      <div class='chatbot-img-container'>
        <img src='/static/imgs/chatbot.jpeg' class='chatbot-img' width='250px' height='250px'>
      </div>
      <div class='m-5' id='message-container'>
        <h4 class='fw-bold'>${assistant_name}</h4>
      </div>
      <div class='mx-5'>
        <button class='mx-2' id='btn-stop-speaker' onclick='stopSpeaker()'>
          <img src='/static/imgs/stop.png' width='80px' height='80px'>
        </button>
        <button class='mx-2' id='btn-play-speaker' onclick='playSpeaker()'>
          <img src='/static/imgs/play.png' width='80px' height='80px'>
        </button>
        <button class='mx-2' id='btn-cancel-speaker' onclick='cancelSpeaker()'>
          <img src='/static/imgs/cancel.png' width='80px' height='80px'>
        </button>
        <button id="generate-pdf-button" onclick='generatePDF()'>Generate PDF</button>
      </div>
    </div>`);
  $('.chatbot-speaker').addClass('chatbot-speaker-visible');
  $('#btn-stop-speaker').hide();
  $('#btn-play-speaker').hide();
  $('.chatbot-speaker').show();

  recognition.start();

});


$(window).on('beforeunload', async function () {

  if (localStorage.getItem('thread_id') !== null) {
    await delete_conversation_thread();
  }

});


// --------------------------------------------------
//                 custom exceptions
// --------------------------------------------------


class CustomError extends Error {
  constructor(name, message) {
    super(message);
    this.name = name;
  }
}

// Otra clase de error personalizada
class PaymentRequiredError extends CustomError {
  constructor(message) {
    super('PaymentRequiredError', message);
  }
}

// --------------------------------------------------
//                 initialization
// --------------------------------------------------


$(document).ready(async function () {

  await initialize();

  $("#message-container h6").text(`{{assistant_name}}`.replace("{{assistant_name}}", assistant_name));
  $("#message-container p").text(`{{welcome_message}}`.replace("{{welcome_message}}", welcome_message));

  $(".loader-wrapper").fadeOut(1200, function () {
    $("#contenido").fadeIn(1500);
  });

});

//$( document ).ready(function(){});
//$( window ).on( "load", function(){});