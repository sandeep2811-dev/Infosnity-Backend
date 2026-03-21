


import db from "../config/database.js";
import { loginUser } from "./user.controller.js";

// ... generatePlaceholders function remains the same ...
const generatePlaceholders = (rowCount, columnCount, startIndex = 1) => {
    let sets = [];
    for (let i = 0; i < rowCount; i++) {
        let placeholders = [];
        for (let j = 0; j < columnCount; j++) {
            placeholders.push(`$${startIndex++}`);
        }
        sets.push(`(${placeholders.join(', ')})`);
    }
    return sets.join(', ');
};

const addAchievement = async (req, res) => {
    const role = req.session.role; // Ensure session is working
    
    // ✅ FIX: Allow only Faculty and Administration
    if (role === "faculty" || role === "administration") {
        
        const { 
            titleOfAchivement, 
            teamName, 
            teamMembers, 
            AchievedDate, 
            Mentor, 
            descriptionOfAchivement
        } = req.body;
        console.log(req.body);

        if (!titleOfAchivement || !teamMembers || teamMembers.length === 0) {
            return res.status(400).json({ message: 'Missing core achievement details or team members.' });
        }
        
        let connection;

        try {
            connection = await db.connect(); 
            await connection.query('BEGIN');
            
            // Insert Achievement
            const achievementQuery = `
                INSERT INTO Achievements (titleOfAchivement, teamName, AchievedDate, Mentor, descriptionofachivements)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING achievementid 
            `;
            const achievementValues = [titleOfAchivement, teamName, AchievedDate, Mentor, descriptionOfAchivement];
            const achievementResult = await connection.query(achievementQuery, achievementValues);
            const achievementId = achievementResult.rows[0].achievementid;
            
            // Insert Team Members
            if (teamMembers && teamMembers.length > 0) {
                let flatValues = [];
                const columnCount = 4;
                teamMembers.forEach(member => {
                    flatValues.push(achievementId, member.idNo, member.name, member.branch);
                });
                const placeholders = generatePlaceholders(teamMembers.length, columnCount);
                const memberQuery = `INSERT INTO TeamMembers (achievementid, idNo, name, branch) VALUES ${placeholders}`;
                await connection.query(memberQuery, flatValues); 
            }

            await connection.query('COMMIT');
            res.status(201).json({ message: 'Achievement added successfully' });

        } catch (error) {
            if (connection) await connection.query('ROLLBACK');
            console.error("Transaction failed:", error);
            res.status(500).json({ message: 'Database error occurred' });
        } finally {
            if (connection) connection.release(); 
        }

    } else {
        // ⛔ Block Students
        return res.status(403).json({ message: "Unauthorized: Only Faculty/Admin can add achievements." });
    }
};

const getAchievements = async (req, res) => {
    // ... (Keep your existing getAchievements logic exactly as it is) ...
    // Just pasting the query part for reference to ensure no variables are lost
    let connection;
    try {
        connection = await db.connect(); 
        const query = `
            SELECT a.achievementid, a."titleofachivement", a."teamname", a."achieveddate", a."mentor", a."descriptionofachivements",
                   t.idno, t.name AS member_name, t.branch
            FROM Achievements a
            LEFT JOIN TeamMembers t ON a.achievementid = t.achievementid
            ORDER BY a."achieveddate" DESC, a.achievementid DESC;
        `;
        const result = await connection.query(query);
        const rows = result.rows;

        const achievementsMap = new Map();
        for (const row of rows) {
            const achievementId = row.achievementid;
            if (!achievementsMap.has(achievementId)) {
                achievementsMap.set(achievementId, {
                    achievementId: achievementId,
                    titleOfAchivement: row.titleofachivement, 
                    teamName: row.teamname,
                    AchievedDate: row.achieveddate,
                    Mentor: row.mentor,
                    descriptionOfAchivements: row.descriptionofachivements,
                    teamMembers: []
                });
            }
            if (row.idno) { 
                achievementsMap.get(achievementId).teamMembers.push({
                    idNo: row.idno,
                    name: row.member_name,
                    branch: row.branch
                });
            }
        }
        const finalAchievements = Array.from(achievementsMap.values());
        // console.log(finalAchievements);
        res.status(200).json({ success: true, data: finalAchievements });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: 'Failed to fetch achievements.' });
    } finally {
        if (connection) connection.release(); 
    }
};

export { addAchievement, getAchievements };