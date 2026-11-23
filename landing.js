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
// ORIGEM DO LEAD — lê os parâmetros do link do anúncio
// (utm_source, utm_campaign, utm_content) ou, na falta deles,
// o fbclid que a Meta adiciona sozinha. Vai na mensagem do
// WhatsApp para você saber de qual anúncio a pessoa veio.
// ------------------------------------------------------------
var ORIGEM = (function () {
    var p = new URLSearchParams(window.location.search);
    var partes = [p.get('utm_source'), p.get('utm_campaign'), p.get('utm_content')].filter(Boolean);
    if (partes.length) return partes.join(' / ');
    if (p.get('fbclid')) return 'anuncio Meta';
    return 'site';
})();

var campoOrigem = document.getElementById('origem');
if (campoOrigem) { campoOrigem.value = ORIGEM; }

// Todos os links de WhatsApp levam a origem na mensagem pronta
document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
    try {
        var u = new URL(a.href);
        var t = u.searchParams.get('text') || 'Olá! Quero agendar uma reunião.';
        u.searchParams.set('text', t + '\n\n(Origem: ' + ORIGEM + ')');
        a.href = u.toString();
    } catch (err) { }
});

// Meta Pixel: QUALQUER clique em link de WhatsApp conta como Contato
document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
    a.addEventListener('click', function () {
        if (window.fbq) { fbq('track', 'Contact', { content_name: a.getAttribute('data-evento') || 'whatsapp' }); }
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'clique_whatsapp', local: a.getAttribute('data-evento') || 'whatsapp' });
    });
});

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
        'Gostaria de agendar uma reunião estratégica.\n\n' +
        '(Origem: ' + ORIGEM + ')';

    // Evento de conversão (configure o gatilho "lead_formulario" no GTM)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'lead_formulario', assunto: tema });

    // Meta Pixel: conversão de Lead
    if (window.fbq) { fbq('track', 'Lead', { content_name: tema }); }

    // Cópia dos dados no Netlify Forms (painel do Netlify → Forms).
    // Assim o contato não se perde mesmo que a pessoa não envie a mensagem no WhatsApp.
    try {
        var dados = new URLSearchParams({
            'form-name': 'contato',
            'bot-field': '',
            nome: nome,
            telefone: tel,
            tema: tema,
            mensagem: caso,
            origem: ORIGEM
        });
        fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: dados.toString(),
            keepalive: true
        }).catch(function () { });
    } catch (err) { }

    window.open('https://wa.me/' + NUMERO_WHATSAPP + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
});

// ------------------------------------------------------------
// 4. Eventos de clique nos CTAs (data-evento) para o dataLayer
// ------------------------------------------------------------
document.querySelectorAll('[data-evento]').forEach(function (el) {
    el.addEventListener('click', function () {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'clique_cta', local: el.getAttribute('data-evento') });
    });
});


// ------------------------------------------------------------
// 5. Vídeo de introdução (primeira seção da página)
//    - tenta começar COM som; se o navegador bloquear, começa
//      sem som e o botão "Ativar som" fica pulsando
//    - pausa quando a pessoa rola para baixo e retoma ao voltar
//    - fundo desfocado sincronizado no computador/tablet
// ------------------------------------------------------------
(function () {
    var intro = document.getElementById('introVideo');
    if (!intro) return;

    var v = document.getElementById('introPrincipal');
    var fundo = document.getElementById('introFundo');
    var btnSom = document.getElementById('introSom');
    var txtSom = document.getElementById('introSomTexto');
    var nada = function () { };

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
        var usar = (window.innerWidth / window.innerHeight) > 0.6;
        intro.classList.toggle('com-fundo', usar);
        if (usar) {
            fundo.currentTime = v.currentTime;
            if (!v.paused) { fundo.play().catch(nada); }
        } else {
            fundo.pause();
        }
    }

    // Toca; se o navegador bloquear o som, toca sem som
    function tocar() {
        var t = v.play();
        if (t && t.catch) {
            t.catch(function () {
                v.muted = true;
                v.play().catch(nada);
            });
        }
    }

    v.addEventListener('volumechange', atualizarSom);
    v.addEventListener('play', function () {
        if (intro.classList.contains('com-fundo')) { fundo.play().catch(nada); }
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
        if (!v.muted && v.paused) { tocar(); }
        evento(v.muted ? 'video_som_desligado' : 'video_som_ligado');
    });

    // Primeiro toque em qualquer área do vídeo (fora dos botões) liga o som
    function primeiroToque(e) {
        if (e.target.closest('button, a')) return;
        intro.removeEventListener('pointerdown', primeiroToque);
        if (v.muted) {
            v.muted = false;
            if (v.paused) { tocar(); }
        }
    }
    intro.addEventListener('pointerdown', primeiroToque);

    // Pausa ao sair da tela (quem rola para ler não fica ouvindo o áudio)
    // e retoma ao voltar para o vídeo
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                if (e.isIntersecting) {
                    if (v.paused && !v.ended) { tocar(); }
                } else {
                    v.pause();
                }
            });
        }, { threshold: 0.35 }).observe(intro);
    }

    // Botão "ASSISTIR VÍDEO" do hero: volta ao topo e reinicia com som
    var btnAssistir = document.getElementById('botaoAssistir');
    if (btnAssistir) {
        btnAssistir.addEventListener('click', function () {
            evento('video_reaberto');
            intro.removeEventListener('pointerdown', primeiroToque);
            v.currentTime = 0;
            v.muted = false;
            tocar();
            intro.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Ao carregar a página, começa a tocar
    v.muted = false;
    tocar();
    atualizarSom();
    atualizarFundo();
})();
