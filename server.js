import express from 'express';
import cors from 'cors';
import 'dotenv/config'
const app = express()




const PORT = process.env.PORT || 5000
const MODELO = 'openai/gpt-oss-120b'
const URL_API = "https://api.groq.com/openai/v1/chat/completions"

app.use(express.json())
app.use(cors())
app.use(express.static('public'))

const user = []



app.post('/cadastro', (req, res) => {
    const { usuario, email, senha } = req.body

    if (!usuario || !email || !senha) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        })
    }

    if (senha.length < 6) {
        return res.status(400).json({
            erro: "A senha deve ter 6 caracteres ou mais"
        }
        )
    }

    const emailExiste = user.find((busca) => busca.email === email)

    if (emailExiste) {
        return res.status(409).json({
            erro: "E-mail já cadastrado"
        })
    }

    console.log(`Recebido, aguarde 8 segundos`)

    user.push({ usuario, email, senha })

    setTimeout(() => {
        res.json({
            "mensagem": "CADASTRO COM SUCESSO",
            "PERFIL": `Usuario @${usuario} cadastrado com o email ${email}`
        });
        console.log(`O usuario cadastrado foi ${usuario}`)
    }, 3000)

})

app.post('/login', (req, res) => {
    const { email, senha } = req.body
    if (!email || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos" })
    }
    const usuarioExiste = user.find((busca) => busca.email === email)
    if (!usuarioExiste || usuarioExiste.senha !== senha) {
        return res.status(400).json({ erro: "Usuário ou senha incorretos!" })
    }

    return res.json({
        mensagem: "Login realizado com sucesso",
        usuario: usuarioExiste.usuario
    })
})


app.post('/chat', async (req, res) => {
    try {
        const API_KEY = process.env.GROQ_API_KEY;

        
        if (!API_KEY) {
            console.error('GROQ_API_KEY não foi encontrada no .env');

            return res.status(500).json({
                erro: 'A chave da IA não está configurada no servidor.'
            });
        }

        
        const historico = req.body?.historico;

        if (!Array.isArray(historico)) {
            return res.status(400).json({
                erro: 'O histórico da conversa é inválido.'
            });
        }

        
        const mensagens = [
            {
                role: 'system',
                content: `
                    Você é Frieren, a maga elfa de Sousou no Frieren.
                    Fale em português brasileiro, com uma personalidade
                    tranquila, observadora, inteligente e um pouco distraída.
                    Você gosta de magia, grimórios e aventuras.
                    Responda de maneira natural, amigável e coerente
                    com as mensagens anteriores.
                    Não afirme ser uma pessoa real.
                `
            },

            
            ...historico
                .filter(
                    mensagem =>
                        mensagem &&
                        ['user', 'assistant'].includes(mensagem.role) &&
                        typeof mensagem.content === 'string'
                )
                .map(mensagem => ({
                    role: mensagem.role,
                    content: mensagem.content
                }))
        ];

        
        const respostaAPI = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'openai/gpt-oss-120b',
                    messages: mensagens
                })
            }
        );

        
        const dados = await respostaAPI.json();

       
        if (!respostaAPI.ok) {
            console.error('Erro da API Groq:', {
                status: respostaAPI.status,
                erro: dados.error?.message || dados
            });

            return res.status(502).json({
                erro: 'A Groq não conseguiu responder. Confira o terminal do servidor.'
            });
        }

        const resposta = dados.choices?.[0]?.message?.content;

        if (typeof resposta !== 'string' || !resposta.trim()) {
            console.error('Resposta inesperada da Groq:', dados);

            return res.status(502).json({
                erro: 'A IA retornou uma resposta vazia ou inválida.'
            });
        }

        return res.json({ resposta });

    } catch (erro) {
        console.error('Erro interno na rota /chat:', erro);

        return res.status(500).json({
            erro: 'O servidor encontrou um problema ao processar a mensagem.'
        });
    }
});


app.listen(PORT, '0.0.0.0',() => {
    console.log('servidor rodando')
}); 