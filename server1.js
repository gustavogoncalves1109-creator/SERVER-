import express from 'express';
import cors from 'cors';
import 'dotenv/config'
const app = express()

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'


const PORT = process.env.PORT || 5000
const MODELO = 'openai/gpt-oss-120b'
const URL_API = "https://api.groq.com/openai/v1/chat/completions"

app.use(express.json())
app.use(cors())
app.use(express.static('public'))

const user = []

app.get('/', (req, res) => {
    return res.json(user)
})

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
        const API_KEY = process.env.GROQ_API_KEY
        const historico = req.body.historico || []

        const persona = [
            {
                "role": "system",
                "content": "Você é um assistente de IA útil e amigável."
            }
        ];

        persona.push(...historico);


        const respostaBruta = await fetch(URL_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODELO,
                messages: persona
            })
        });

        const resultado = await respostaBruta.json();

        if (!respostaBruta.ok) {
            console.log(" Erro retornado pela Groq:", resultado);
            return res.status(500).json({ erro: "Erro na comunicação com a Groq." });
        }

        return res.json({ resposta: resultado.choices[0].message.content });

    } catch (erro) {
        return res.status(500).json({ erro: "Falha interna no servidor." });
    }
});


app.listen(PORT, '0.0.0.0',() => {
    console.log('servidor rodando')
}); 