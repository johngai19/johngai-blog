I'd been wanting to build a small program for handling PDF files — a practical tool to solve problems I kept running into. The thing is, it involves a lot of different technologies, and I could never find enough time to finish it. Then recently, I thought: why not try with GPT's help?

I hadn't used Python much in the past few years, and I wasn't familiar with libraries like PyQt or PyPDF. So I decided to let AI fill in the gaps. ChatGPT, in particular, gave me a running start — it helped me get the interface up and the basic functions working fast.

In the early stages, AI's role was mostly about providing code suggestions and solving specific problems. I'd ask how to build a user interface with PyQt, and it would return detailed steps and working code. That simplified things enormously. For the PDF side, I described what I wanted — for example, finding and removing watermarks — and AI generated code snippets that became the foundation of the project.

At this stage, its performance was genuinely impressive. As long as I described the menu bar, toolbar, buttons, and features in detail, AI could produce the entire interface code in one go, virtually error-free. To push it further, I added a requirement for real-time Chinese-English interface translation. AI handled that quickly and accurately too. After some adjustments to layout, icon placement, and feature arrangement, I had a working program interface.

But as I went deeper, I started seeing the limits.

AI's knowledge comes from its training data. When the problem is novel or unusual, it can't always find its way to a real solution. For the watermark removal — the core feature of the whole project — the methods AI suggested were technically sound but never got to the heart of the problem.

Here's what happened. Most solutions online use the pypdf2 package. That package hasn't been maintained since 2016. AI didn't flag this. It just followed the existing approaches it had seen — outdated package, incomplete ideas, no breakthrough. So I searched for the current state of things myself, switched to pypdf, and told AI to regenerate its code with the new library. That part went fine. But for the actual watermark removal logic, no matter how I prompted it, AI kept circling back to the same known approaches. It couldn't propose anything genuinely new.

The real breakthrough came from my own thinking. I realized that simply deleting objects from the PDF or changing background colors wasn't going to work. What I did instead was use AI to list every element in the PDF file. Looking at those elements, I noticed a pattern: watermarks are repeated elements. So the approach became identifying elements that appear on every page and removing them. The innovation was in targeting the structural repetition rather than relying on image-level processing. That idea came entirely from human reasoning, not from AI's data-driven responses.

Where AI did shine was in debugging. During development I ran into all kinds of programming errors. Whenever something broke, I'd describe the error to AI and usually get back a plausible cause and a fix. That instant feedback helped me move fast through many problems.

Even there, though, it had limits. Complex logic, design trade-offs — AI's answers could be shallow. For those, I had to rely on my own analysis. The pattern kept repeating: AI is fast, but for anything that requires real understanding, the human brain is still doing the heavy lifting.

As the project progressed, I explored more sophisticated features — fine-tuning the PyQt interface, optimizing the PDF processing algorithms. AI remained useful at every step. Whenever I had a question about improving the layout or tweaking an algorithm, it would come back with relevant suggestions and code. These kept the development moving, freeing me to focus on higher-level design.

Another area where AI proved valuable was resource discovery. Whether I needed a specific Python library, wanted to understand its API, or was looking for a tool to solve a particular problem, AI returned answers quickly. It saved me hours of searching and introduced me to resources I hadn't known about. It also tended to offer multiple solutions, which gave me flexibility. When I needed to package the application as an executable, for instance, AI didn't just suggest PyInstaller — it also mentioned cx_Freeze and explained how to build for different operating systems.

Toward the end, I started thinking about release and distribution. AI recommended GitHub Actions for automated builds and provided detailed configuration steps. With its guidance, I packaged the application for both Windows and Linux and set up automatic publishing to GitHub Releases.

What I took away from this small project is straightforward. AI is a powerful tool. It accelerates development, offers resources, handles the tedious parts. But the real solutions — the ones that matter — still come from human thinking. AI couldn't see that the watermark problem was about structural repetition. I could. In the future, combining human creativity with AI's computing power will open up a great deal. This project is as much a record of that collaboration as it is a piece of software. Curiosity about technology, the urge to build something new — those are still what keep things moving.

The project repository is available online. If possible, I'll continue adding features and sharing more thoughts on working alongside AI.
