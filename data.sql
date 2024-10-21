-- Use the Blogging Database
USE blog;

-- Inserting data into Users
INSERT INTO Users (username, email) VALUES 
('johndoe', 'john.doe@example.com'),  -- John Doe
('janesmith', 'jane.smith@example.com'),  -- Jane Smith
('michaeljohnson', 'michael.j@example.com'),  -- Michael Johnson
('emilydavies', 'emily.d@example.com'),  -- Emily Davies
('davidwilliams', 'david.w@example.com');  -- David Williams

-- Inserting data into Posts
INSERT INTO Posts (title, content, user_id) VALUES 
('10 Tips for Effective Time Management', 'Time management is crucial for success. Here are my top 10 tips to help you manage your time better: 1. Prioritize tasks, 2. Set deadlines, 3. Use tools and apps, 4. Limit distractions, 5. Take breaks, 6. Learn to say no, 7. Review your day, 8. Delegate tasks, 9. Set goals, 10. Stay organized.', 1),  -- Post by John Doe
('The Best Travel Destinations for 2024', 'As we head into 2024, these travel destinations should be at the top of your list: 1. Japan, 2. Italy, 3. Iceland, 4. New Zealand, 5. Canada. Each offers unique experiences that cater to every type of traveler.', 2),  -- Post by Jane Smith
('How to Stay Motivated During Tough Times', 'Staying motivated can be difficult, especially during challenging periods. Here are some strategies: 1. Set small goals, 2. Surround yourself with positivity, 3. Practice self-care, 4. Seek support from friends and family.', 3),  -- Post by Michael Johnson
('Delicious Recipes for Healthy Eating', 'Eating healthy doesn’t have to be boring. Here are three quick and delicious recipes to try: 1. Quinoa salad, 2. Grilled salmon with asparagus, 3. Vegetable stir-fry.', 4),  -- Post by Emily Davies
('A Beginner’s Guide to Learning Python', 'Python is a versatile programming language. Here’s a beginner’s guide to help you get started: 1. Understand the basics, 2. Practice coding regularly, 3. Build simple projects, 4. Join online communities for support.', 5);  -- Post by David Williams

-- Inserting data into Comments
INSERT INTO Comments (comment_text, post_id, user_id) VALUES 
('Great tips! I really need to work on my time management.', 1, 2),  -- Jane comments on John\'s post
('This list is spot on! I can’t wait to travel next year.', 2, 1),  -- John comments on Jane\'s post
('Thanks for sharing these strategies. I’ll definitely try them out.', 3, 4),  -- Emily comments on Michael\'s post
('I love these recipes! Can\'t wait to cook them for my family.', 4, 3),  -- Michael comments on Emily\'s post
('Python is such a great language! Looking forward to learning more.', 5, 2);  -- Jane comments on David's post

