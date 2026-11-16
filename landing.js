/* =======================================================================
   LANDING PAGE — ABRAÃO J MIGUEL ADVOCACIA DO AGRO
   Scripts: reveal ao rolar, máscara de telefone, envio do formulário
   para o WhatsApp e eventos para o dataLayer (GTM / Pixel).
   Carregado no fim do <body> do index.html.
======================================================================== */

// ------------------------------------------------------------
// CONFIGURAÇÃO — número do WhatsApp que recebe os leads
// (formato internacional, só dígitos)
// ------------------------------------------------------------
var NUMERO_WHATSAPP = '5543991041313';

// ------------------------------------------------------------
// 1. Reveal ao rolar a página
// ------------------------------------------------------------
(function () {
    var itens = document.querySelectorAll('.revelar');
    if (!('IntersectionObserver' in window)) {
        itens.forEach(function (el) { el.classList.add('visivel'); });
        return;
    }
    var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            if (e.isIntersecting) {
                e.target.classList.add('visivel');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.12 });
    itens.forEach(function (el) { obs.observe(el); });
})();

// ------------------------------------------------------------
// 2. Máscara do telefone: (00) 00000-0000
// ------------------------------------------------------------
var campoTel = document.getElementById('tel');
campoTel.addEventListener('input', function () {
    var d = this.value.replace(/\D/g, '').slice(0, 11);
    if (d.length > 6) {
        this.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length > 10 ? 7 : 6) + '-' + d.slice(d.length > 10 ? 7 : 6);
    } else if (d.length > 2) {
        this.value = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    } else if (d.length > 0) {
        this.value = '(' + d;
    }
});

// ------------------------------------------------------------
// 3. Envio do formulário → abre o WhatsApp com a mensagem pronta
//    + evento para o GTM / Pixel (dataLayer)
// ------------------------------------------------------------
document.getElementById('formularioContato').addEventListener('submit', function (e) {
    e.preventDefault();

    var nome = document.getElementById('nome').value.trim();
    var tel = campoTel.value.trim();
    var tema = document.getElementById('tema').value;
    var caso = document.getElementById('msg').value.trim();

    if (!nome || tel.replace(/\D/g, '').length < 10 || !tema) {
        alert('Por favor, preencha nome, WhatsApp (com DDD) e o assunto principal.');
        return;
    }

    var texto = 'Olá! Meu nome é ' + nome + '.\n' +
        'Assunto: ' + tema + '.\n' +
        (caso ? 'Meu caso: ' + caso + '\n' : '') +
        'Meu WhatsApp: ' + tel + '\n' +
        'Gostaria de agendar uma reunião estratégica.';

    // Evento de conversão (configure o gatilho "lead_formulario" no GTM)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'lead_formulario', assunto: tema });

    // Meta Pixel: conversão de Lead
    if (window.fbq) { fbq('track', 'Lead', { content_name: tema }); }

    window.open('https://wa.me/' + NUMERO_WHATSAPP + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
});

// ------------------------------------------------------------
// 4. Eventos de clique nos CTAs (data-evento) para o dataLayer
// ------------------------------------------------------------
document.querySelectorAll('[data-evento]').forEach(function (el) {
    el.addEventListener('click', function () {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'clique_cta', local: el.getAttribute('data-evento') });

        // Meta Pixel: clique no WhatsApp conta como Contato
        if (window.fbq && el.href && el.href.indexOf('wa.me') !== -1) { fbq('track', 'Contact'); }
    });
});


// ------------------------------------------------------------
// 5. Vídeo de introdução em tela cheia
//    - tenta começar COM som; se o navegador bloquear, começa
//      sem som e o botão "Ativar som" fica pulsando
//    - fundo desfocado sincronizado no computador/tablet
// ------------------------------------------------------------
(function () {
    var intro = document.getElementById('introVideo');
    if (!intro) return;

    var v = document.getElementById('introPrincipal');
    var fundo = document.getElementById('introFundo');
    var btnSom = document.getElementById('introSom');
    var txtSom = document.getElementById('introSomTexto');
    var btnFechar = document.getElementById('introFechar');
    var btnAgendar = document.getElementById('introAgendar');
    var fechado = false;

    function evento(nome) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: nome });
    }

    function atualizarSom() {
        var ligado = !v.muted;
        btnSom.classList.toggle('ligado', ligado);
        btnSom.setAttribute('aria-pressed', ligado ? 'true' : 'false');
        txtSom.textContent = ligado ? 'Desativar som' : 'Ativar som';
    }

    // Fundo desfocado só quando a tela é mais "larga" que o vídeo vertical
    function atualizarFundo() {
        if (fechado) return;
        var usar = (window.innerWidth / window.innerHeight) > 0.6;
        intro.classList.toggle('com-fundo', usar);
        if (usar) {
            fundo.currentTime = v.currentTime;
            if (!v.paused) { fundo.play().catch(function () { }); }
        } else {
            fundo.pause();
        }
    }

    v.addEventListener('volumechange', atualizarSom);
    v.addEventListener('play', function () {
        if (intro.classList.contains('com-fundo')) { fundo.play().catch(function () { }); }
    });
    v.addEventListener('pause', function () { fundo.pause(); });
    v.addEventListener('timeupdate', function () {
        if (intro.classList.contains('com-fundo') && Math.abs(fundo.currentTime - v.currentTime) > 0.4) {
            fundo.currentTime = v.currentTime;
        }
    });
    window.addEventListener('resize', atualizarFundo);

    // Botão de som
    btnSom.addEventListener('click', function () {
        intro.removeEventListener('pointerdown', primeiroToque);
        v.muted = !v.muted;
        if (!v.muted && v.paused) { v.play().catch(function () { }); }
        evento(v.muted ? 'video_som_desligado' : 'video_som_ligado');
    });

    // Primeiro toque em qualquer área do vídeo (fora dos botões) liga o som
    function primeiroToque(e) {
        if (e.target.closest('button, a')) return;
        intro.removeEventListener('pointerdown', primeiroToque);
        if (v.muted) {
            v.muted = false;
            if (v.paused) { v.play().catch(function () { }); }
        }
    }
    intro.addEventListener('pointerdown', primeiroToque);

    function fechar() {
        if (fechado) return;
        fechado = true;
        v.pause();
        fundo.pause();
        intro.classList.remove('aberto', 'com-fundo');
        document.body.classList.remove('sem-rolagem');
    }

    btnFechar.addEventListener('click', function () {
        evento('video_fechado');
        fechar();
    });

    btnAgendar.addEventListener('click', function (e) {
        e.preventDefault();
        fechar();
        var alvo = document.getElementById('agendar');
        if (alvo) { alvo.scrollIntoView({ behavior: 'smooth' }); }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { fechar(); }
    });

    // Abre o vídeo e tenta tocar com som
    function abrir(reiniciar) {
        fechado = false;
        intro.classList.add('aberto');
        document.body.classList.add('sem-rolagem');
        if (reiniciar) { v.currentTime = 0; }
        v.muted = false;
        var tentativa = v.play();
        if (tentativa && tentativa.catch) {
            tentativa.then(atualizarFundo).catch(function () {
                // Navegador bloqueou o som automático: começa sem som
                v.muted = true;
                v.play().then(atualizarFundo).catch(function () { });
            });
        }
        atualizarSom();
        atualizarFundo();
    }

    // Botão "ASSISTIR VÍDEO" do hero: reabre o vídeo desde o início
    var btnAssistir = document.getElementById('botaoAssistir');
    if (btnAssistir) {
        btnAssistir.addEventListener('click', function () {
            evento('video_reaberto');
            abrir(true);
        });
    }

    // Ao carregar a página, abre automaticamente
    abrir(false);
})();
