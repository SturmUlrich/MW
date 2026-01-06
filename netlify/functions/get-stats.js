// Netlify Function для получения статистики
// Использует Supabase для получения данных

exports.handler = async (event, context) => {
    // Разрешаем CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Обработка preflight запроса
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Только GET запросы
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Проверяем наличие переменных окружения Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            // Если Supabase не настроен, возвращаем пустой объект
            console.warn('Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({})
            };
        }

        // Используем Supabase
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data: allStats, error } = await supabase
            .from('stats')
            .select('*')
            .order('total_correct', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        // Преобразуем в формат для фронтенда
        const statsObject = {};
        if (allStats) {
            allStats.forEach(stat => {
                statsObject[stat.player_name] = {
                    totalCorrect: stat.total_correct || 0,
                    totalIncorrect: stat.total_incorrect || 0,
                    totalGames: stat.total_games || 0,
                    games: stat.games || []
                };
            });
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(statsObject)
        };
        
    } catch (error) {
        console.error('Error getting statistics:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};
