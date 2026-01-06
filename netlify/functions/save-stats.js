// Netlify Function для сохранения статистики
// Использует Supabase для хранения данных

exports.handler = async (event, context) => {
    // Разрешаем CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Только POST запросы
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const statsData = JSON.parse(event.body);
        const { playerName, gameStats } = statsData;

        // Валидация данных
        if (!playerName || !gameStats) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields: playerName, gameStats' })
            };
        }

        // Проверяем наличие переменных окружения Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            // Если Supabase не настроен, возвращаем ошибку
            console.warn('Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
            return {
                statusCode: 503,
                headers,
                body: JSON.stringify({ 
                    error: 'Database not configured',
                    message: 'Please configure Supabase. See SUPABASE_SETUP.md for instructions.'
                })
            };
        }

        // Используем Supabase
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Получаем существующую статистику
        const { data: existingStats, error: fetchError } = await supabase
            .from('stats')
            .select('*')
            .eq('player_name', playerName)
            .single();
        
        let userStats;
        
        if (existingStats) {
            // Обновляем существующую статистику
            userStats = {
                ...existingStats,
                games: existingStats.games || []
            };
        } else {
            // Создаем новую запись
            userStats = {
                player_name: playerName,
                total_correct: 0,
                total_incorrect: 0,
                total_games: 0,
                games: []
            };
        }
        
        // Обновляем статистику
        const newGame = {
            ...gameStats,
            date: new Date().toISOString()
        };
        
        userStats.games.push(newGame);
        userStats.total_correct += gameStats.correct || 0;
        userStats.total_incorrect += gameStats.incorrect || 0;
        userStats.total_games += 1;
        
        // Ограничиваем историю игр (последние 50)
        if (userStats.games.length > 50) {
            userStats.games = userStats.games.slice(-50);
        }
        
        // Сохраняем в Supabase
        let error;
        if (existingStats) {
            const { error: updateError } = await supabase
                .from('stats')
                .update({
                    total_correct: userStats.total_correct,
                    total_incorrect: userStats.total_incorrect,
                    total_games: userStats.total_games,
                    games: userStats.games,
                    updated_at: new Date().toISOString()
                })
                .eq('player_name', playerName);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('stats')
                .insert([userStats]);
            error = insertError;
        }
        
        if (error) {
            throw error;
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true,
                message: 'Statistics saved successfully'
            })
        };
        
    } catch (error) {
        console.error('Error saving statistics:', error);
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
