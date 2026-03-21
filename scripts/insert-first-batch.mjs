/**
 * Insert the first batch of 5 curated articles into Supabase.
 * Run: node scripts/insert-first-batch.mjs
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim()
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

function calcReadingTime(zh, en) {
  const zhChars = (zh || '').replace(/\s/g, '').length
  const enWords = (en || '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(Math.max(zhChars / 500, enWords / 200)))
}

const articles = [
  // ──────────────── Article 1: 走出挪威的森林 ────────────────
  {
    slug: 'leaving-the-forest',
    title_zh: '走出挪威的森林',
    title_en: 'Leaving the Forest',
    category: 'books',
    tags: ['murakami', 'book-review', 'audiobook', 'time', 'memory'],
    status: 'draft',
    source: 'weizhiyong',
    source_url: 'https://www.weizhiyong.com/archives/2101',
    published_at: '2024-10-05T17:54:13+08:00',
    cover_image: '/covers/leaving-the-forest.png',
    excerpt_zh: '坐在沙发上听完十三小时的《挪威的森林》有声书，二十五年里读过不下十遍的故事，在英语朗读中又呈现出全新的面貌。森林里待得太久了，是时候走出来了。',
    excerpt_en: 'After finishing a thirteen-hour audiobook of Norwegian Wood — a story read five, maybe ten times over twenty-five years — I realized I had been lost in that forest far too long. It was time to leave.',

    content_zh: `坐在小书桌旁的沙发上，我为自己倒了一杯气泡酒。窗外，太阳正下山，最后一束光线射在阳台上。周围的建筑开始闪烁起灯光。我打开门，走到阳台上，倚靠在栏杆上。这座城市从未安静过；开门或窗总会带来噪音。这通常很烦人，但在那一刻，它让我感到真实而安宁，加强了我对这个世界如同庞大机器般运转的感觉——这是我迫切需要的。

就在几分钟前，我刚听完《挪威的森林》的有声书。我从未想过自己能完成一段超过13小时的音频，尤其是英语版本的。然而，从第一分钟起，我就被深深吸引，全身心投入。每一个词都清晰无比，仿佛无缝转换成了我的语言，旁白的声音就像是我早已耳熟能详的旋律。

事实上，过去25年里，我已经读过这本书多次——大概五到十遍。我对故事的熟悉使得每一个句子都在我脑海中勾勒出生动的场景，增强了叙述的传达。

时间在不知不觉中流逝。我深入故事的世界，就像多年来我在森林中的漫步。每一次造访森林都带来不同的感受，这些感受受到季节和我的年龄的影响。这一次的体验有很大的不同；也许是因为我以前从未听过这样的有声书，或许是因为我从未完整地阅读过一本英文书。我必须集中注意力，一步步跟随旁白，这与自己阅读时完全不同。我注意到了以前可能忽略的细节，发现了熟悉景观中的新元素。

这次有声书之旅让我想起了我第一次的长途驾驶。在那次超过1300公里的旅程之前，我从未想象过自己会独自驾车超过200公里。从那以后，我对距离的感知发生了变化；现在，500到800公里的旅程似乎很短。我相信，在这13小时的有声书之后，我对长音频的定义也发生了改变。

我的时间观念已经转变。就像那次长途旅行一样，年轻时我几乎无法想象未来几年的计划。活在当下是我唯一的关注点，尽管我期待着夏季和冬季的假期，期待着信件的回复。那时候，我无法设想未来的生活。现在，在我第一次接触《挪威的森林》后的25年里，我的时间观完全改变了。我几乎记不清这些年间什么时候读过这么多次《挪威的森林》，但那些时刻确实发生了，与其他记忆融为一体。随着年龄的增长，记忆在我脑海中变得扁平，它们的顺序变得模糊，区分记忆、梦境和想象变得困难。但这并不重要；它们无论如何都存在于我的脑海中，别人并不知晓也不在乎。无论我多么思考过去事件的真实性或时机，我都无法返回，哪怕一秒钟。我只需要生活，有意留白。

然而，有些场景在我的记忆中依然鲜活，比我个人的回忆更加生动。我记得奥雷连诺·布恩迪亚面对行刑队的情景，记得一个老妇人在公共场所的入口大厅被一个男人搭讪的瞬间，还有一个拥有622段爱情的老人告诉一个老妇人，他已经等了她51年9个月又4天。我还记得一个12或13岁的男孩宣称，第一次来他家的表亲就是他以前在某个地方遇到过的女孩。在所有这些场景中，我真正想突出的是渡边和直子漫步的森林和草地，柏林机场降落的波音747，直子生日的那个夜晚，以及无处呼唤的绿子。《挪威的森林》对我的生活产生了重大影响，影响了我交友的方式、我的写作、我的爱情以及我对世界的看法。

从37岁的年龄，回顾我的生活似乎很遥远，当我第一次读《挪威的森林》时，很难想象自己有一天会到那个年龄。但现在，37岁那个年龄早已过去，而且无法回头。只有在故事中，人们从17岁活到20岁，然后又回到17岁，只有在故事中，一个37岁的男人不断回顾他的早年，而不会变老。但在现实世界中，时间从不停止。

过去的一周里，我一有时间就听那个有声书，它结束得太快了。突然间，我有了一个顿悟，一个声音告诉我，我在森林里待得太久了，是时候离开了。确实，我突然意识到了这个真相。是的，我在《挪威的森林》中迷失了太久，尽管我读过村上春树的所有其他小说，但没有一部像它那样深刻地影响我。我读了《挪威的森林》中提到的书，如《魔山》和《了不起的盖茨比》，听了提到的音乐，爱上了其中的几首。我想帮助我所关心的每一个人，把他们视为像直子那样的受害者。然而，大多数人都很正常，既不需要也不理解这种奇特的帮助想法。

看来我已经被《挪威的森林》的世界困住了，的确，是时候离开了，就像渡边决定在没有直子的情况下重新勇敢地生活。这种认识再次触动我；只要我继续这样想，我可能永远无法离开。但这并不重要；这毕竟不是真正的森林，我可以决定自己是留是走。再次，就像书中森林里的井的隐喻，它是否真实并不重要。

有声书的章节最终结束了，我的森林之旅也随之结束。喝完这杯，我将去睡觉，希望我能睡个好觉。毕竟，明天又是新的一天。`,

    content_en: `I poured myself a glass of sparkling wine, sitting on the couch by the small desk. Outside, the sun was going down, the last light falling across the balcony. The buildings around me were starting to glow. I opened the door and stepped out, leaning against the railing. This city has never been quiet — opening any window brings noise in. That usually bothers me. But right then, it felt solid, reassuring, like proof that the world's enormous machinery was still running. That was exactly what I needed.

A few minutes earlier, I had finished the audiobook of *Norwegian Wood*. I never thought I could sit through thirteen hours of audio, especially in English. Yet from the first minute, I was pulled in completely. Every word came through clearly, as if the language had dissolved into something already mine — the narrator's voice a melody I had somehow always known.

Over the past twenty-five years, I've read this book many times. Five, maybe ten. My familiarity with the story turned every sentence into a vivid scene in my mind, sharpening what the narrator delivered.

Time slipped by without notice. I walked deeper into the story the way I've walked through that forest for years. Each visit brings something different — shaped by the season, shaped by my age. This time felt markedly different; perhaps because I had never listened to a book like this before, or perhaps because I had never made it through an entire English text. I had to pay close attention, following the narrator step by step, which is nothing like reading at my own pace. I noticed details I might have skipped before. I found new elements in a landscape I thought I knew by heart.

This audiobook journey reminded me of my first long drive. Before that trip — over 1,300 kilometers — I couldn't imagine driving more than 200 alone. Afterward, my sense of distance shifted; now, 500 to 800 kilometers feels short. I believe that after these thirteen hours, my definition of "long audio" has changed in much the same way.

My sense of time has shifted too. Like that long drive, when I was young I could barely plan a few years ahead. Living in the present was all I could manage, though I looked forward to summer and winter breaks, looked forward to letters being answered. I couldn't picture what lay beyond. Now, twenty-five years after I first picked up *Norwegian Wood*, my sense of time has changed completely. I can barely recall when, across all those years, I read it so many times — but those moments happened, blending into other memories. As I age, memories flatten in my mind; their order blurs; telling memory from dream from imagination becomes difficult. But it doesn't matter. They exist in my head regardless, unknown and unimportant to anyone else. No matter how much I think about the truth or timing of past events, I cannot go back. Not by a single second. I just need to live, and leave space deliberately blank.

Yet certain scenes remain more alive in my memory than my own experiences. I remember Aureliano Buendía facing the firing squad. I remember an old woman being approached by a man in the entrance hall of a public place. I remember an old man with 622 love affairs telling an old woman he had waited for her fifty-one years, nine months, and four days. I remember a boy of twelve or thirteen declaring that the cousin visiting his house for the first time was a girl he had met before, somewhere. Among all these scenes, what I really want to highlight are the forests and meadows where Watanabe and Naoko walked, the Boeing 747 landing at the Berlin airport, Naoko's birthday night, and Midori with no one to call out to. *Norwegian Wood* has profoundly shaped my life — how I make friends, how I write, how I love, how I see the world.

From the vantage point of thirty-seven, looking back at my life when I first read the book, it seemed impossible to imagine ever reaching that age. But now thirty-seven is already behind me, and there's no going back. Only in stories do people live from seventeen to twenty and then return to seventeen; only in stories does a thirty-seven-year-old man keep looking back at his early years without growing older. In the real world, time never stops.

Over the past week, I listened to the audiobook whenever I had a chance. It ended too quickly. Then, suddenly, a realization — a voice telling me I had been in the forest too long. It was time to leave. And it was true. I had been lost in *Norwegian Wood* for too long. I've read all of Murakami's other novels, but none has marked me the way this one has. I read the books mentioned in it — *The Magic Mountain*, *The Great Gatsby*. I listened to the music it mentioned and fell in love with some of it. I wanted to help everyone I cared about, seeing them as victims like Naoko. But most people are perfectly fine. They neither need nor understand that peculiar urge to help.

It seems I've been trapped in the world of *Norwegian Wood*. Indeed, it's time to leave — just as Watanabe chose to live bravely again without Naoko. This realization stings again; as long as I keep thinking this way, I may never leave. But it doesn't matter. This isn't a real forest. I can decide whether to stay or go. And again, like the metaphor of the well in the forest, whether it's real doesn't matter.

The audiobook ended. So did my walk in the forest. I'll finish this glass and go to sleep. I hope I sleep well. After all, tomorrow is another day.`,
  },

  // ──────────────── Article 2: 四十自述 ────────────────
  {
    slug: 'at-forty',
    title_zh: '四十自述',
    title_en: 'At Forty',
    category: 'life',
    tags: ['life-reflection', 'engineering', 'midlife', 'identity'],
    status: 'draft',
    source: 'weizhiyong',
    source_url: 'https://www.weizhiyong.com/archives/2066',
    published_at: '2023-12-30T12:33:39+08:00',
    cover_image: '/covers/at-forty.png',
    excerpt_zh: '入行十八年一直在搞技术，却没法回答"你到底是做什么的"。从CAD到嵌入式、从PLC到JavaScript，门门都通反而难有所成。四十岁，困惑依旧。',
    excerpt_en: 'Eighteen years in the field, and I still can\'t answer a simple question: what exactly is it that I do? From CAD to embedded systems, from PLC to JavaScript — knowing everything, mastering nothing. At forty, the confusion remains.',

    content_zh: `入行18年一直在搞技术。但是经常没法回答一个问题，"你到底是做什么的"。

仔细梳理一下，这18年以来，我大概掌握了这么些即使算不上精通，至少也在熟练水平以上的技能：画CAD，EPLAN电气设计，试验系统设计，节能系统，暖通系统，水处理系统，天然气煤矿，交通自控，汽车电子系统设计，航空航天配电，起落架，发射点火装置设计，画PCB板，电子电路设计，功率电路设计，STM32，DSP嵌入式系统设计，接电气柜，编PLC程序，编上位软件程序，编嵌入式系统程序，编其他基于C、C++、C#、LabVIEW、Python、JavaScript程序，攒电脑，修电脑，Windows、Linux、NAS操作系统维护，基础的SolidWorks、SketchUp机械和三维设计，MATLAB，Power World电力系统仿真，专业的办公软件技能，PS、AE、PR、Blender图形图像处理，PMP项目管理，工程概预算，方案设计……

如果加上技术工作之外的工作，还包括了企业经营，销售，市场管理，产品设计等等。虽然很难解释清楚，但我还总是觉得，自动化专业学的，好像这些东西多多少少都有，我只是一一都践行了。如果当初学的是别的专业，可能反而能在某个方面有所深入和大成。但是这样门门都通，反而很难有所成就。

软件行业有一个形容全面的称谓叫"全栈工程师"，但也仅至于软件前后端的一小部分领域。我感觉像我这样搞自动化的，差不多快成"one Dragon engineer"（一条龙工程师）了。

很早之前和笑波聊天，他说对村上春树小说里印象很深的是《海边的卡夫卡》里的一句"人不是因为其缺点，而是因为其优点而被卷入更大的悲剧之中"。很多年后我突然有所领悟。即将过去的2023年，最突出的一个词可能要属于ChatGPT了，对我而言，在此之前，要在如此多的主题之间往复穿梭，往往会力不从心，也给身边的人和伙伴带来很多困扰，但是ChatGPT仿佛一个超级工具集来赋能，脑子里萌生了好几年但是没法做完的事情可能一夜之间就可以实现。

这一年我四十岁了，对于这个世界，我仍然充满着困惑，年初的时候我买了一本大塚寿的《40岁，精彩人生才开始》，但这一年并没有因为这本书变的精彩起来，但我仍然怀有这样的期许。这一年生日的时候，张学友难得的发布了一首新歌《又十年》，陆陆续续听了一年。这一年不再听张信哲的那首《三十好几》。这一年脑中常常想起《一代宗师》里叶问的台词："我七岁学拳，四十之前未见过高山。到第一次碰到，发现原来最难过的，是生活。"`,

    content_en: `Eighteen years in the field, and I still can't answer a simple question: what exactly is it that I do?

Let me try to lay it out. Over these eighteen years, I've picked up skills that, if not quite expert-level, are at least well above basic: CAD drafting, EPLAN electrical design, test system design, energy-saving systems, HVAC, water treatment, natural gas and coal mining systems, traffic automation, automotive electronics, aerospace power distribution, landing gear, launch ignition systems, PCB layout, analog circuit design, power electronics, STM32 and DSP embedded systems, wiring electrical cabinets, PLC programming, HMI/SCADA software, embedded firmware, and software in C, C++, C#, LabVIEW, Python, JavaScript. Building and fixing computers. Maintaining Windows, Linux, and NAS systems. Basic SolidWorks and SketchUp for mechanical and 3D design. MATLAB. Power World for power system simulation. Professional-level office software. Photoshop, After Effects, Premiere, Blender. PMP project management. Engineering budgets and proposals...

Add in the non-technical work — running a business, sales, marketing, product design — and you start to see the problem. I've always felt that my major in automation somehow touched all of these things, and I simply went and practiced every one of them. Had I studied something more specific, I might have gone deep in one area and actually achieved something. But knowing a bit of everything makes it hard to achieve anything.

In software, there's a term for someone who does it all: "full-stack engineer." But that only covers a small slice of front-end and back-end. For someone in automation like me, the more accurate title might be "one Dragon engineer" — a one-stop-shop engineer who does the whole chain, from hardware to software to everything in between.

Years ago, my friend Xiaobo told me about a line from Murakami's *Kafka on the Shore* that stuck with him: "People are not drawn into tragedy by their weaknesses, but by their strengths." It took me many years to understand what that meant. The defining word of 2023 was probably ChatGPT. Before it, shuttling between so many domains left me stretched thin, often causing confusion for the people around me. But ChatGPT arrived like a supercharged toolkit — ideas that had been gestating in my head for years could suddenly be realized overnight.

This year I turned forty. I'm still confused about the world. Early in the year I bought a book called *Life Gets Exciting at 40*. The year didn't get exciting because of it, but I still hold on to the hope. On my birthday, Jacky Cheung released a rare new song, *Another Ten Years*. I listened to it on and off all year. I stopped listening to Jeff Chang's *In My Thirties*. And a line from the film *The Grandmaster* kept echoing in my head — Ip Man saying: "I started learning martial arts at seven. Before forty, I had never seen the mountains. When I finally reached them, I realized the hardest thing to overcome was simply life."`,
  },

  // ──────────────── Article 3: 成佛记 ────────────────
  {
    slug: 'the-monk-who-knew-everything',
    title_zh: '成佛记',
    title_en: 'The Monk Who Knew Everything',
    category: 'writing',
    tags: ['parable', 'buddhism', 'creative-writing', 'classical-chinese'],
    status: 'draft',
    source: 'weizhiyong',
    source_url: 'https://www.weizhiyong.com/archives/1942',
    published_at: '2023-01-04T10:49:31+08:00',
    cover_image: '/covers/the-monk-who-knew-everything.png',
    excerpt_zh: '某朝某代名山古刹中的智拙大师，自幼聪颖过人，一心向佛数十年，美色功名不能动其心，艰难险阻不能摇其志。唯独佛法的至高境界，始终触摸不到。',
    excerpt_en: 'In a mountain temple of some forgotten dynasty, Master Zhizhuo — brilliant, handsome, sought by empresses and bandits alike — devoted his entire life to the pursuit of enlightenment. He mastered everything except the one thing he wanted most.',

    content_zh: `在某朝某代某个名山古刹中，有一位得道高僧，法号智拙，既然得道，我们不妨称他为智拙大师吧。

话说这位智拙大师，自幼便是孤儿，六岁那年被这座古刹里的僧人收留，十四岁剃度出家，自出家以来，智拙大师几十年如一日，心无旁骛，苦心钻研佛法，但求有一天可以修成正果，去那无苦寂灭道的西方极乐世界，远离这人世间的一切悲苦。

虽然智拙大师在佛法上的造诣已然很深了，但与他一心向佛的念头相比，还是微不足道的。因为这位智拙大师，自幼就聪颖异常，加之涉猎广泛，长成后才思敏捷、博闻强识，外貌又英俊潇洒，似乎生而为人的一切优点，都集中到了他身上。这样的优点，如果能在一个凡人身上，科举一定会名列三甲，为官一定会飞黄腾达，若再娶一房玉一般的妙人儿为妻，可以过上神仙似的生活。可在智拙大师身上，这些优点却变成了潜心向佛的障碍。英俊丑陋，在智拙看来，都一般无二，不过一张臭皮囊而已，但在芸芸众生眼里却不是这样。从智拙成年起，庙里就不时有一些借进香为名的女孩儿们，在智拙背后指指点点，低声说些什么，然后就害羞的跑掉，留下一串串银铃般的笑声。当然也有大胆的女孩子，以丝帕之类的信物相赠，更有甚者，悄悄托人劝说智拙还俗。对于这些，还没有成为大师的智拙从未放到心上，最多也只会以佛法包容的眼光，报以怜悯的微笑，笑这芸芸众生，沉浸于爱欲海中不得解脱。

不单爱欲从未能打动过智拙大师，功名也同样没有，随着年纪渐长，智拙大师的名气越来越大，几乎每任地方长官都要数次请智拙大师出山，当然其中有些是真的求贤若渴，其他的只不过想落一个求贤之名而已。但无论如何，每个来访的人开出的条件，无不让人怦然心动。但智拙大师依然心如止水，没有因为这些身外之物丝毫改变自己一心向佛的志向。甚至后来智拙这个法号传到皇帝耳中，皇帝数次下诏召见，也未能打动他。

如果锦衣玉食、荣华富贵说明不了什么，艰难险阻、贫困辛劳也同样未能丝毫动摇过智拙大师的向佛之心。为了潜心修行，他曾经徒步拜谒天下的名山古刹，行程的艰难困苦自不必说了，被困山中月余不得脱的事情有过，遇到强盗数次险些丢失性命的事情也有过，至于狼虫虎豹，更是数不胜数。或许是因为佛法无边，或者仅仅是智拙大师幸运，这些经历次次都是有惊无险，在最无奈的时候化险为夷。而这样那样的艰辛，恰恰更加坚定了智拙大师的心。

时人有了解智拙大师的，评价说，他的志向犹如浩瀚蓝天中的一只雄鹰，盘旋着俯视大地上的一切。只要他肯落下来，整个世界都是他的。而偏偏他从不肯让自己的羽翼着地，他的志向在九天之外。对地上的万物来说，那都是虚无缥缈的空中楼阁，而对智拙而言，却是实实在在值得追求的东西。因此，他这一生，只会朝着那个目标向上飞。

这段佚名的评价很贴切，它分毫不差的刻画出了智拙大师一生的轨迹。对于外物的毫无所求，和他对精神上的要求遥相辉映。但世事奇怪的地方在于，越是无所求，就越容易得到，越是有所求，却偏偏得不到。智拙大师的名气传遍海内，这座古刹也因此名震天下，然而修道之人，境界如鱼饮水，冷暖自知，如果还有一点事情可以让这位智拙大师烦恼的话，那就是在佛法修为上的停滞不前。浩如烟海的佛经也精研了数十年，在别人眼中依然是得道高僧的自己，却明白其实不过是博学而已，总觉得什么地方没有参透，但又不知道究竟是在哪里，佛经上的"顿悟"二字，从未体验过。虽然自己一心向佛，从心中到行为，除了佛法之外心无旁骛，但佛法的至高境界总是触摸不到，有时打坐的时候感觉到了那种极快乐、极轻灵的时候，凡心一起，又倏然消失了。这样的苦恼，和凡夫俗子在外物上的烦乱虽然层次不一，但也有相通之处：明明可以看得到，触摸得到，偏偏得不到，这才是追求中最痛苦的体验。

然而时不我待，凡夫俗子也好，得道高僧也好，只要没有摆脱这一副臭皮囊的，都会有一命呜呼的那天。名闻天下的智拙大师也不例外。这一日，九十高龄的智拙大师打坐时，隐隐感觉自己大限将到，便召集所有在寺内的弟子前来。最后一次为诸弟子讲经，讲的却是再普通不过的《般若波罗蜜多心经》："观自在菩萨，行深般若波罗蜜多时，照见五蕴皆空，度一切苦厄。舍利子，色不异空，空不异色；色即是空，空即是色。受想行识，亦复如是……"

智拙大师讲着讲着，声音渐小，慢慢变成低声自语。堂下众僧知道，这是大师即将圆寂了，于是齐齐低眉，吟诵佛号，一时间大厅里佛号四起，远处隐隐钟声，无比庄严，又无比悲恸。这时门外走进来一位小童，似乎是三四代的弟子，还未剃度，他端一杯清茶，旁若无人的走到智拙大师身前，厅中众僧竟毫无察觉。小童轻声问道："方丈，饮茶否？"这时的智拙，虽然仍在低吟，但魂魄已然浑浑噩噩，即将飘散，突然被这声清脆的声音打断，回光返照一般又恢复了清醒，睁开眼睛，不觉长叹一声"南无阿弥陀佛"，堂下众僧被这声佛号惊动，齐刷刷停了下来，看着眼前这对老少，大厅突然之间显得分外宁静，只有远处的钟声传进来。

小童大约是看到方丈没有回答，又低声问："方丈，饮茶否？"身边一位老僧悄然站起，走到小童身旁，低声说："你先下去吧，今日不饮茶了。"小童疑惑的问道："方丈日日饮茶，一如既往，为何今日不饮呢？"堂下众僧心底只怨小童不懂事，盼的那老僧早些将他拉出去，但小童这番话传到智拙耳中，却是另一番味道，自己一心向佛，如同自己老年后这日日饮茶的习惯一样，到今日都要做一个了断了，今日之后，饮茶也罢，向佛也罢，都不会再有了，想到此处，即使是智拙大师这样心静如水之人，临终之前也不觉动情，微闭的眼中，挤出半滴浊泪来。这时走上来的老僧又开口了，依然低声，但在这本已很安静的大厅中，却显得很响亮："你先下去，茶且放下，放下吧。"

或许智拙大师的修为，到此刻才到那至高的境界，"放下，放下吧"，听到老僧这番话，智拙不觉心动：放下，放下吧。茶也放下，佛也放下，一生执著的念头，此时此刻，都该放下了。智拙大师此念一起，突然觉得浑身一轻，刚刚还有的那种老迈糊涂的感觉，全都冰释了。然而这种外在的感觉，和内心精神上的欢愉相比，则是不值一提的，智拙大师就像那只盘旋一生的雄鹰，在濒死的一刻，终于飞上了九天之外。

此时大厅里的众僧也无比惊异，智拙大师的身上隐隐发出万道金光，把个大厅映得金碧辉煌。正在众僧诧异的时候，突然眼前一暗，只见那万道金光化作一道，倏然直奔西方而去了。再回头看时，智拙大师已然圆寂，或者说已然成佛归西，只留下一副皮囊，静静的端坐在蒲团之上。"南无阿弥陀佛"大厅中佛号再起，远处钟声依旧。大厅外，一轮斜阳正向山后隐去，橘黄色的光芒，漫山遍野。`,

    content_en: `In a mountain temple of some dynasty, some era, there was a monk of great renown. His dharma name was Zhizhuo. Since he was considered enlightened, let us call him Master Zhizhuo.

Master Zhizhuo had been an orphan since birth. At six, the monks of this ancient temple took him in. At fourteen, he shaved his head and took his vows. From that day forward, for decades without interruption, he devoted himself single-mindedly to the study of Buddhist scripture, seeking nothing less than the ultimate liberation — to reach the Pure Land of the West and leave behind every sorrow of the human world.

His mastery of the dharma was already deep, yet compared to his devotion, it was nothing. For Zhizhuo had been gifted from childhood — brilliant, widely read, sharp in thought and vast in knowledge, and handsome besides, as if every virtue a person could possess had gathered in one body. Had these gifts belonged to an ordinary man, he would have ranked first in the imperial examinations, risen swiftly in office, married well, and lived like an immortal. But in Zhizhuo, these gifts became obstacles to his practice. Handsome or ugly, to him it was all the same — just a skin sack. But the world didn't see it that way. From the time Zhizhuo came of age, young women would visit the temple under the pretense of burning incense, whispering behind his back, then running off in shy laughter. Some bolder ones left silk handkerchiefs as tokens. Others quietly sent messengers urging him to return to lay life. None of this ever touched him. At most, he would offer a gentle, pitying smile — the look of a man who saw all beings drowning in the ocean of desire.

Neither love nor glory could move him. As his reputation grew, every local governor sought his counsel — some genuinely, others merely to burnish their own name as seekers of wisdom. The offers were always extraordinary. But Zhizhuo's heart remained still as water. Even when the Emperor himself issued summons, repeatedly, the master would not come.

If wealth and honor proved nothing, then hardship and danger proved equally little. To deepen his practice, he once walked on foot to every famous temple in the land. The difficulties need not be described: there were times when he was trapped in mountains for over a month, times when bandits nearly took his life, and encounters with wolves and tigers too numerous to count. Perhaps through the boundless protection of the dharma, or perhaps through mere luck, he survived each crisis. And every hardship only strengthened his resolve.

Someone who knew him once said: his ambition was like an eagle circling the vast blue sky, looking down upon the entire earth. If only he would land, the whole world would be his. But he never let his wings touch the ground. His aim lay beyond the highest heavens. To everything below, that was a castle in the air — but to Zhizhuo, it was the only thing worth reaching for. And so he would fly upward, always upward, for the rest of his life.

This anonymous observation was precise. It captured the arc of his entire existence. His indifference to worldly things mirrored perfectly his spiritual hunger. But the world has a strange way about it: the less you want, the more you receive; the more you want, the less you get. Zhizhuo's fame spread across the land. The temple became known everywhere. And yet — only the fish knows how the water feels. If anything still troubled the master, it was this: after decades of study, he had not advanced. He had read the vast ocean of sutras for a lifetime. To others he was still the enlightened master. But he knew the truth — he was merely learned. Something remained unpenetrated, and he couldn't identify what. The word "sudden awakening" in the scriptures — he had never once experienced it. In meditation, sometimes he would feel that state of perfect lightness, perfect joy — and then a single worldly thought would arise, and it would vanish instantly. This suffering, though on a different plane from ordinary frustration, shared its essential shape: to see it, to almost touch it, and yet never to grasp it. That is the deepest pain of any pursuit.

But time waits for no one. Common man or enlightened monk — anyone still carrying this body will one day reach the end. The renowned Master Zhizhuo was no exception. One day, at the age of ninety, while sitting in meditation, he sensed faintly that his time had come. He summoned all the disciples in the temple. For his final teaching, he chose the most ordinary text of all — the Heart Sutra: "Avalokiteshvara, when practicing deeply the Prajnaparamita, perceived that all five skandhas are empty, and was saved from all suffering and distress. Shariputra, form does not differ from emptiness, emptiness does not differ from form..."

His voice grew quieter as he spoke, fading to a whisper. The monks below understood — the master was departing. They lowered their eyes and began chanting, and the hall filled with the sound of the Buddha's name, solemn and sorrowful, mixing with the distant toll of bells. Then, through the door, a young boy walked in — a novice of the third or fourth generation, not yet tonsured. He carried a cup of clear tea and approached the master as if nothing unusual were happening. The hall full of monks didn't even notice him.

"Abbot," the boy asked softly, "would you like some tea?"

Zhizhuo, though still murmuring, was already drifting — his spirit growing hazy, ready to scatter. But that clear young voice cut through. Like a final flash of lucidity, he opened his eyes, and sighed deeply: "Namo Amitabha." The monks fell silent. Every eye turned to the old man and the child. The hall became extraordinarily still. Only the distant bells continued.

The boy, seeing no answer, asked again: "Abbot, would you like some tea?" An elderly monk rose quietly, walked to the boy's side, and whispered: "Go now. No tea today." The boy looked confused: "But the abbot drinks tea every day, always the same. Why not today?" The monks silently wished the old monk would just take the child away. But for Zhizhuo, these words carried a different weight entirely. His lifelong devotion to the dharma was like his daily habit of tea — and today, both would end. After today, there would be no more tea, no more seeking. At this thought, even a man as serene as Zhizhuo could not hold back his feeling. From his half-closed eyes, a single clouded tear fell. The old monk spoke again, still softly, but in the silence of the hall it rang out clearly: "Go now. Set down the tea. Let it go."

Perhaps Zhizhuo's practice reached its highest point only in this moment. *Let it go.* Hearing the old monk's words, something stirred in him: let it go. The tea, let it go. The dharma, let it go. A lifetime of striving — all of it, let go. The instant this thought arose, his body felt suddenly light. The confusion and frailty of old age dissolved completely. But this physical sensation was nothing compared to the joy within. Like the eagle that had circled the sky for an entire lifetime, in the moment of death, Master Zhizhuo finally soared beyond the ninth heaven.

The monks in the hall watched in astonishment as golden light began to radiate from the master's body, filling the hall with brilliance. Then darkness fell — the thousand rays of light converged into one and shot westward in an instant. When they looked again, Master Zhizhuo had passed — or rather, had become a Buddha and departed for the West. Only his body remained, sitting quietly on the cushion. "Namo Amitabha." The chanting rose again. The bells continued in the distance. Outside the hall, a setting sun was sinking behind the mountain, its orange light spreading across the hills.`,
  },

  // ──────────────── Article 4: 真正的价值还是人脑 ────────────────
  {
    slug: 'the-human-in-the-machine',
    title_zh: '真正的价值还是人脑——一个人工智能辅助项目的启发',
    title_en: 'The Human in the Machine',
    category: 'engineering',
    tags: ['ai', 'python', 'chatgpt', 'software-development', 'creativity'],
    status: 'draft',
    source: 'weizhiyong',
    source_url: 'https://www.weizhiyong.com/archives/2061',
    published_at: '2023-12-21T09:16:08+08:00',
    cover_image: '/covers/the-human-in-the-machine.png',
    excerpt_zh: '用ChatGPT辅助开发一个PDF处理工具——AI生成了漂亮的界面代码，却无法突破水印删除的核心算法。真正的突破来自人脑：识别重复元素模式。',
    excerpt_en: 'Building a PDF tool with ChatGPT as co-pilot — AI generated a polished interface in one shot but couldn\'t crack the core watermark removal algorithm. The real breakthrough came from a human insight: detecting repeated elements.',

    content_zh: `### 第一部分：项目启动和人工智能的使用

一直想开发一个处理PDF文件的小程序来解决实际使用中的问题，但是由于涉及的技术比较多，很难在有限时间内完成。最近突然想使用GPT的辅助功能做一个尝试。Python语言近几年用的比较少，对PyQt和PyPDF这些库的应用并不熟悉。因此，我决定利用人工智能的力量来弥补我的不足。AI技术，尤其是ChatGPT，为我提供了一个跳板，帮助我快速实现了软件的界面和基本功能。

在这个项目的早期阶段，AI的作用主要是提供代码建议和解决特定问题。例如，我询问AI如何使用PyQt创建用户界面，AI给出了详细的步骤和代码示例，这极大地简化了我的开发过程。同样，对于PDF处理，我向AI详细描述了我想要实现的功能，例如搜索和删除PDF中的水印。基于这些描述，AI生成了相关的代码片段，这些代码成为了项目的基石。

在这个阶段，AI的能力表现是非常惊人的，只要详细的描述对菜单栏工具栏主要的按钮与功能的要求，AI基本上可以一次性完全无误的输出整个的界面程序代码，为了增加难度，我在这个项目中提供了中英文界面实时翻译的功能要求，AI也都可以很快速的准确无误地实现这些功能。经过对布局功能排布和图标等要求的修改，最终生成的程序界面如下。

### 第二部分：AI的局限性与人类创造力的重要性

然而，在使用AI的过程中，我也意识到了它的局限性。AI的知识和能力是建立在预先训练的数据之上的。当面对创新或独特的问题时，AI可能无法提供有效的解决方案。在我们的项目中，AI提供的水印删除方法，虽然是基于已知的技术，但并没有真正触及问题的核心。

在这个阶段，AI体现出了它的局限性，首先，由于互联网上处理类似问题大多是基于pypdf2软件包，但是这个包自从2016年起已经不再维护了，AI并没有意识到这个包的过时性，而是仿照网络上现有的解决方案仍然用这样陈旧过时的包，以及网络上已有的一些并不完美的思路和方案没有办法进行突破，并提出新的创造性的解决方案。因此在看到AI提出的使用pypdf2代码之后，我首先进行搜索，并且将这个包替换为pypdf，并建议AI按照新的包来重新生成代码，这部分工作AI完成的还是不错的。但是在核心功能，本项目的水印删除部分，无论怎么样提示AI只能采用已有的解决方案和思路，没有办法给出创新的真正解决问题的办法。

真正的突破仍然是由人类的思维和创造力实现的。在这个过程中，我意识到单纯的删除PDF中的对象或更改背景颜色并不能有效地移除水印。我使用AI列出了PDF文件的所有元素，从这些元素中找到新的规律，对传统的方法进行加强和完善：即识别PDF文件中重复出现的元素并将其删除。这种方法的创新之处在于它直接定位了重复的水印元素，而不是依赖于表面的图像处理。这一思路的灵感完全来自于人类的创造性思维，而非AI的数据驱动响应。

### 第三部分：AI在错误排查中的作用

尽管在创新方面有所局限，但AI在排查和解决编程错误方面表现出色。在开发过程中，我遇到了各种各样的编程问题和错误。每当这些问题出现时，我就向AI描述错误信息。AI通常能根据其知识库提供潜在的原因和解决方案。这种即时的反馈在很多情况下帮助我快速定位问题并找到解决办法。

然而，AI在这方面的帮助也有其局限性。当问题涉及复杂的逻辑或设计决策时，AI的回答有时可能显得片面或不够深入。在这些情况下，必须依靠自己的分析能力和理解来找到解决方案。这再次凸显了在解决复杂问题时人脑的重要性。

### 第四部分：项目进展和AI的辅助

随着项目的深入，我开始探索更复杂的功能，如PyQt界面的细节调整和PDF处理算法的优化。在这个阶段，AI的帮助仍然是不可或缺的。每当我对如何改进用户界面或优化算法有疑问时，AI总能给出有用的建议和代码片段。这些及时的帮助加速了开发过程，使我能够专注于更高层次的设计和创新。

### 第五部分：AI的辅助工具和资源搜索

在项目开发中，另一个AI展现出色的方面是提供工具和资源。无论是寻找特定的Python库、了解其使用方法，还是寻找解决特定问题的工具，AI都能快速给出答案。此外，AI在回答我的问题时往往会提供多种解决方案，这给了我更多的选择和灵活性。在项目的最后阶段，通过AI的帮助，我能够将应用程序打包为Windows和Linux下的可执行文件，并自动发布到GitHub的Release版本中。

### 结论：人脑与AI的协同作用

通过这个小项目的开发，我深刻体会到人脑与AI的协同作用的重要性。AI作为一个强大的工具，能够加速开发过程、提供丰富的资源和技术支持。然而，真正的创新和问题的核心解决方案仍然依赖于人类的创造力和思维。在未来的技术发展中，人类的创造力和AI的强大计算能力相结合，将会开辟出无限的可能性。

项目仓库地址：https://github.com/weizy0219/pdfer`,

    content_en: `### Part One: Kicking Off the Project with AI

I had been wanting to build a small PDF processing tool to solve some real-world problems, but the range of technologies involved made it hard to finish in any reasonable amount of time. Recently, I decided to try using GPT as an assistant. My Python had gotten rusty — I wasn't familiar with PyQt or PyPDF anymore. So I turned to AI to fill the gaps. ChatGPT in particular gave me a running start, helping me quickly produce the interface and basic functionality.

In the early stages, AI's role was mainly to suggest code and solve specific problems. I asked it how to build a UI with PyQt — it gave me detailed steps and working examples, which simplified the process enormously. For PDF processing, I described the features I wanted — like searching for and removing watermarks — and AI generated the relevant code snippets. These became the foundation of the project.

At this stage, AI's capabilities were genuinely impressive. As long as I described the menu bar, toolbar, buttons, and features in detail, it could output the entire interface code in one shot, essentially error-free. To push it further, I added a requirement for real-time Chinese-English interface translation. AI handled that too, quickly and accurately.

### Part Two: Where AI Falls Short — And Where Human Creativity Matters

But I also discovered AI's limitations. Its knowledge is built on pre-trained data. When facing genuinely novel problems, it can't always deliver. In our project, the watermark removal methods AI suggested were based on existing techniques — but they didn't get to the core of the problem.

Here's what happened: most solutions online use the pypdf2 package, which hasn't been maintained since 2016. AI didn't flag this. It just reproduced the stale approach from the internet, unable to break through the known-but-imperfect methods. I searched myself, replaced pypdf2 with pypdf, and asked AI to regenerate the code — that part went smoothly. But for the core feature — watermark removal — no matter how I prompted it, AI could only offer existing solutions. It couldn't invent a new one.

The real breakthrough came from human thinking. I realized that simply deleting objects or changing background colors wouldn't effectively remove watermarks. Instead, I had AI list every element in the PDF file, then I spotted a new pattern myself: identify the elements that repeat across pages — those are the watermarks — and delete them. This approach directly targeted the repeated watermark elements rather than relying on surface-level image processing. The insight came entirely from human creativity, not from AI's data-driven responses.

### Part Three: AI as a Debugging Partner

Despite its limitations in innovation, AI excelled at finding and fixing programming errors. Throughout development, I ran into all kinds of bugs. Each time, I described the error to AI, and it usually identified the likely cause and suggested a fix. This instant feedback helped me resolve issues quickly in most cases.

But here too, there were limits. When problems involved complex logic or design decisions, AI's answers sometimes felt shallow. In those moments, I had to rely on my own analysis. Another reminder: for complex problems, the human brain is still essential.

### Part Four: Going Deeper with AI Assistance

As the project progressed, I explored more complex features — fine-tuning the PyQt interface, optimizing the PDF algorithms. AI's help remained indispensable throughout. Whenever I had questions about improving the UI or optimizing an algorithm, AI offered useful suggestions and code fragments. This ongoing support accelerated development and let me focus on higher-level design.

### Part Five: AI as a Research Tool

Another area where AI shone was finding tools and resources. Whether I needed a specific Python library, wanted to learn how it worked, or was looking for a solution to a particular problem, AI delivered answers fast. It often suggested multiple approaches, giving me flexibility. In the final stages, with AI's guidance, I packaged the application as executables for both Windows and Linux and set up automated releases via GitHub Actions.

### Conclusion: The Synergy Between Human and Machine

This small project taught me something important about the partnership between human thinking and AI. AI is a powerful tool — it accelerates development, provides rich resources, and offers strong technical support. But real innovation and the core solutions to hard problems still depend on human creativity and reasoning. The combination of human imagination and AI's computational power will open up extraordinary possibilities.

Project repository: https://github.com/weizy0219/pdfer`,
  },

  // ──────────────── Article 5: 看鱼 ────────────────
  {
    slug: 'lets-go-see-the-fish',
    title_zh: '看鱼',
    title_en: "Let's Go See the Fish",
    category: 'life',
    tags: ['love', 'youth', 'short-story', 'early-writing'],
    status: 'draft',
    source: 'weizhiyong',
    source_url: 'https://www.weizhiyong.com/archives/1648',
    published_at: '2009-06-16T12:14:00+08:00',
    cover_image: '/covers/lets-go-see-the-fish.png',
    excerpt_zh: '"我们去看鱼吧。"在咖啡厅消磨了一个下午后冒出的莫名念头。楚楚笑了，眼睛弯成新月。在这座内陆城市里看鱼，只能去海洋馆。',
    excerpt_en: '"Let\'s go see the fish," I said, out of nowhere. Chuchu laughed, her eyes curving into crescent moons. In a landlocked city, the only place to see fish was the aquarium.',

    content_zh: `"我们去看鱼吧。"我莫名其妙地说。

"看鱼？去哪里？"楚楚抬起头，用困惑的眼神看着我，似乎我说的不是去看鱼而是去看E.T.什么的。

"当然要去有鱼的地方了。"我说。

"怎么突然有这样的想法？"

"我也不清楚，好像远处什么地方突然有鱼在招呼'来看我，来看我'一样，或许在哪里也有未曾谋面的鱼渴望与我们见面，可是没法子从水里游出来吧。"

"真的？脑子里突然有鱼的声音，像打电话那样约你出去？"楚楚觉得好玩似的笑了起来，眼睛弯弯的像新月般惹人爱怜，"不知道鱼会不会说话呢。"

"去看看不就知道了？"看到楚楚有些心动，我不失时机地补上这么一句。"其实看鱼的念头倒也不是突如其来，大概同正在读的书有关吧。"

"在读什么？"

"这本，"我边说边从口袋里拿出书放在桌上，"挺清新的一本书，从封面就很喜欢。"书默默躺在桌上，呈现在两个人面前的，正是我从一开始就喜欢的封面：底色洁白的一尘不染，中部偏下的地方大小参差地写着书名——"雨天的海豚们"，一只灰色的海豚的影子从"雨"字旁边高高跃起，标题下一抹淡蓝的背景色上是日文名——雨の日のイルカたち。下面有一大片蔚蓝，是翻腾着朵朵浪花的大海的一角，但仔细看时，如果没有高高跃起的海豚，说是飘荡着白云的蓝天也可以。海天之间，原本就很难辨别得清楚。

标题与大海之间，有几行小小的从书中摘来的片段。楚楚侧过脑袋，低声读了出来："开始变亮的海面上海豚一跃而起，初升的太阳把光线投在那里。女子的脸颊恢复了健康的肤色。海豚再次跃起，汹涌四溅的水花在崭新的阳光下灿然生辉。"读罢抬起头，给了我一个更灿然的笑脸："好吧，我们去看鱼。"

彼时正是下午，咖啡厅里客人寥寥无几，两人得以坐在靠窗的桌前，有一句没一句边闲聊，边看外面街道上往来的行人。时间是晚春，天气不算热，可也谈不上清凉，窗外穿短裙短袖的也有，穿毛衫长袖的也有，介于两者之间的也有，在这座城市里，也只有这样慵懒舒倦的季节，造物主懒得用酷暑或严寒给衣着加上种种不得已的限制时，人们才能依照自己的心愿打扮。

楚楚穿一件白色T恤，外面松松地罩着橙色抓绒外套，淡蓝的牛仔裤，休闲布鞋。我则穿一件黑色套头衫，深灰色牛仔裤，球鞋。橙色常常让我觉得刺眼而晦涩，可楚楚却总能穿出温暖的快乐与活泼的味道。她斜倚在沙发上的样子，让人觉得无比温馨舒适，一如透过鲜绿的枝叶随意泼洒进来的阳光。

脑子里涌出"看鱼"的念头时，两人已经在咖啡厅里消磨掉大把的光阴，从一个话题转到另一个话题，彼此都说了许多话，可究竟说了些什么，却没法子清晰地追溯出来。98 Degrees在Invisible Man里唱到"You probably spend hours on the phone, talking about nothing at all"，大概与此类似。恋爱是场交流的游戏，两个人在一起未必一定要说些什么，内容毫不重要，似乎只要这么不断地说下去，无论说些什么，彼此的关系都会变得更亲昵。语言难以捉摸的地方也是如此，说出"我想你"这三个字并不能表现出思念的全部情绪，但说出这三个字时的语气与语调，却能传递比这更多的感情。情人之间，这样一边语无伦次地交谈，一边从语言背后捕捉对方流露出的爱意与怜惜。说了许多，却不知所云。

我和楚楚之间的关系，还没有到"恋爱"这一阶段。我们之间，究竟处于何种阶段不得而知。或者，人与人之间的关系并不能用阶段划分，"朋友"不能算作"恋人"的前一阶段。虽然许多爱情都建立在友情的基础之上，可如果一开始不是抱着恋爱的态度交朋友的话，把友谊说成是爱情的前奏，总觉得对两种关系都是亵渎。相较之下，我倒觉得，友谊与爱情可以作为两种并行不悖的关系同时存在。

我喜欢楚楚，这一点清晰无疑。问题在于，我完全不知道她是什么样的念头。她可以不置可否的听我说诸如喜欢思念之类的话，像幼儿园阿姨耐心微笑着听小朋友讲不知所云的故事。

"我们之间不会有什么故事。"当我的倾诉表现的混乱而失去理智的时候，楚楚就会这么微笑着浇上一盆冷水，温柔、甜蜜却又坚决而肯定，宛如无法否认的真理，总让我在顷刻之间无话可说。楚楚的确定自有其理由，"不会有什么故事"这样的话，无论从哪个角度解释都合情合理，无懈可击：I don't deserve you, or you don't deserve me，婉拒的理由总是这两者之一。我其实一直都明白，上帝创造了你，并为你创造出一个独一无二可以去喜欢的对象，已经是莫大的恩赐了，没有谁规定，被喜欢的对象一定要回头喜欢自己身后的那个人。每个人都在为幸福大踏步地向前走，却对身后那个同样辛苦地追逐着自己的对象不屑一顾。

因爱成恨的例子比比皆是，男人很少会长久持续地对某个毫无希望的目标保持兴趣。往往是一时激情上来，立即大献殷勤，仿佛天底下只有自己才是真心真意对对方好的那个人。可是，一旦发现了自己的种种努力已经变得毫无希望，马上就板起面孔，转身走人，投身到下一场追逐中去。我猜，楚楚大约也是觉得，我这种接近她的努力不会长久而持续才这样说的吧。我不知道，她希望我像其他人一样默默走开呢，还是希望出现那个锲而不舍的真正可以喜欢她直到地老天荒的人出现。如果有，我希望那个人可以是我。

可是，类似这种只有时间才掌握着标准答案的问题，在谜底揭晓之前，谁也无法确定些什么。无论我说的多么坚定，可面对楚楚的眼神时，连我自己也觉得语言多么苍白空洞而无力。在楚楚面前，除了等待，我没有任何办法证明任何东西，就连等待本身的意义，也逐渐随着时间推移而变得模糊不清。

我有时甚至觉得，楚楚看我的目光，宛如菩萨低首俯视众生，惋惜、垂怜却从不动情。我们之间仿佛横亘着一条无形的、不可逾越的天堑。无论我说些什么、做些什么，始终都不能再向前一步。或许终此一生，我也无法让楚楚动心，或许终此一生，我们之间的关系都只能停留到在咖啡厅闲聊的阶段，或许，这样脆弱的阶段甚至根本不能如我想象的那样维持如此之久。许多年后，当我垂垂老矣的时候，追忆往昔，该是何等的伤感呢？无论与楚楚在一起的时候是如何快乐，每次转念之间想到这一节，总会悲伤的不能自已。

"走吧，发什么呆呢？"楚楚温柔的声音把我从不知名的哪里唤回现实，两个人前后走出咖啡厅，向目的地进发。在这座内陆的城市里，要看鱼，除了饭店水缸里提心吊胆地活着的那些之外，可以去的地方就只有海洋馆了。

"现在去会不会太晚了呢？"楚楚担心地望着出租车窗外一节节向高楼后沉下去的夕阳，问道。

"我也不知道，"我说，"先去了再说吧。就算不能看到鱼，看看海洋馆本身也可以。"

"经常去海洋馆？"

"其实没去过呢，路过过几次，喜欢海洋馆给人的那种大海的感觉。嗯，说起来，喜欢海倒是真的。"我说。"像你这样在水边长大的孩子，很难体会像我这样的孩子小时候对大海的那种期盼与渴望吧。"

"瞎说，"楚楚说，"你不也是在黄河边长大的吗？"

"那不一样，黄河给人的雄浑感，总觉得与真正的水的感觉有所不同。不同于江南水乡的温柔驯良，也不同于大海的宽广辽阔。或许是在同类匮乏的黄土高原奔腾久了，已经忘记作为水的本身的感觉了吧。"

"你强词夺理。"楚楚说，"所谓的江南了大海了，统统都是你脑子里自己编造出来的。身边明明有一条货真价实的河流，却非要去追求什么江南大海之类虚无缥缈的东西，这样的童年，怕是也不怎么愉快吧。"

"不是想象，确实是不同的。第一次看到江南，是在火车上。早晨一觉醒来，看到三三两两的水域环绕中的白色小楼，小湖中的亭子，朝阳从列车的一侧徐徐升起，当时就想：这样温柔地依偎在水乡中的，才是真正的水，也只有这样的水乡，才能养育出楚楚这样如《雨巷》中描写的那种'丁香一样，结着愁怨的'江南女子吧。"

"贫嘴，那个时候你还不认识我呢。"

"时间偶尔也可以迂回着前进嘛，"我等于承认是在狡辩，我对楚楚总会说一些显然像是在讨好的话。虽然在我觉得，我所说的每一个词都是有感而发，我没有办法用更朴素的语言和方式表达出来，听上去连自己都觉得油腔滑调。可是，这种感觉是没有办法解释清楚的，解释本身也会自然而然地被当做讨好的一部分而适得其反。尝试说明过几次之后，我便放弃了这种无谓的努力——总有能让她认识到这一点的时候吧。我这样安慰自己。我接着说："即使在那个时候，心里也还是坚定地认为，迟早有一天，会遇到楚楚那样一个女子的。只是，'我猜到了这开始，却没有猜到结局。'"我边说边模仿紫霞仙子的神情，眯着眼睛做痛苦状。楚楚故作不理。

不知不觉间，就到了海洋馆门口。天色格外蓝，高高耸立的海洋馆宛如在蓝天中航行的一艘巨轮。`,

    content_en: `"Let's go see the fish," I said, out of nowhere.

"See the fish? Where?" Chuchu looked up at me, puzzled, as if I'd suggested going to see E.T. instead of fish.

"Wherever fish are, obviously."

"What brought this on?"

"I'm not sure. It's like somewhere in the distance, a fish was calling out — *come see me, come see me* — or maybe somewhere there's a fish that wants to meet us but can't swim out of the water."

"Really? A fish calling you, like a phone call?" Chuchu laughed, her eyes curving into little crescent moons. "I wonder if fish can talk."

"Only one way to find out." Seeing she was tempted, I pressed: "Actually, it's not entirely random. It probably has to do with the book I'm reading."

"What are you reading?"

"This one." I pulled the book from my pocket and set it on the table. "I liked it from the cover." There it lay between us — the cover I'd loved from the start: pristine white background, the title written in staggered sizes toward the bottom — *Dolphins on Rainy Days* — with a gray dolphin leaping from beside the first character, and below that, an expanse of blue that could be either sea or sky. Without the dolphin, you couldn't tell which.

Between the title and the ocean, a few lines from the book in small print. Chuchu tilted her head and read them softly: *"A dolphin leaped from the brightening sea. The rising sun cast its light there. The woman's cheeks regained their healthy color. The dolphin leaped again, and the splashing water glittered under the new sunlight."* She looked up and gave me a smile brighter than anything in the passage. "All right. Let's go see the fish."

It was afternoon. The café was nearly empty. We sat by the window, talking about nothing in particular, watching people walk by outside. Late spring — not quite warm, not quite cool. Outside, some wore short sleeves; others still had sweaters on. In this city, only in this drowsy, indulgent season — when nature couldn't be bothered to impose the constraints of heat or cold — could people dress exactly as they pleased.

Chuchu wore a white t-shirt under a loose orange fleece jacket, light blue jeans, canvas shoes. I wore a black pullover, dark gray jeans, sneakers. Orange usually strikes me as harsh, but on Chuchu it always looked warm and cheerful. The way she leaned against the sofa made everything feel comfortable and right, like sunlight filtering casually through green leaves.

By the time the idea of seeing fish surfaced, we had already spent hours in the café, drifting from one topic to the next. We'd said a great deal, but I couldn't have told you what any of it was about. 98 Degrees had a line in "Invisible Man": *You probably spend hours on the phone, talking about nothing at all.* Something like that. Being together is a game of exchange — the content doesn't matter. As long as the talking continues, the closeness deepens. Language works that way too. Saying "I miss you" doesn't express the full weight of missing someone, but the way you say it — the tone, the pause — carries more than the words themselves. Between two people in love, you talk without making sense while reading the affection behind each other's words. You say a lot, and none of it means anything, and all of it means everything.

Chuchu and I hadn't reached the stage you'd call "in love." What stage we were at, I couldn't say. Maybe stages don't apply. Friendship isn't a prelude to romance. Though many love stories grow from friendship, calling friendship a warm-up act for love always felt like an insult to both. I'd rather say they can exist side by side, without contradiction.

I liked Chuchu — that much was beyond doubt. The problem was, I had no idea what she thought. She could listen to me say things like "I like you" or "I miss you" with the patient smile of a kindergarten teacher listening to a child tell a story that makes no sense.

"There won't be a story between us." Whenever my confessions became too chaotic, Chuchu would say this with a smile — gentle, sweet, but absolutely certain, like an undeniable truth. It always left me speechless. The reasoning was airtight: *I don't deserve you, or you don't deserve me.* One of the two. I'd always understood: that God made you, and then made someone specific for you to love, was already an enormous gift. No rule says the person you love has to love you back. Everyone marches forward chasing happiness, ignoring the person running just as hard behind them.

Men who turn love into bitterness are everywhere. Most can't sustain interest in a hopeless cause for long. Passion flares, generosity flows, as if he alone truly cares — and then, finding his efforts futile, he turns cold and walks away to the next pursuit. I suppose Chuchu thought my attention would be the same: temporary. I didn't know whether she wanted me to quietly leave, like all the others, or whether she was waiting for someone persistent enough to prove that he meant it — for as long as it took. If such a person existed, I wanted it to be me.

But questions like these — where only time holds the answer — can't be settled in advance. No matter how firmly I spoke, facing Chuchu's gaze, even I could feel how empty words are. In front of her, all I could do was wait. And even the meaning of waiting grew blurrier with time.

Sometimes I felt that Chuchu looked at me the way a bodhisattva looks down at the suffering world — with pity and compassion, but never stirred. Between us lay an invisible, uncrossable chasm. Nothing I said or did could take me one step further. Perhaps for the rest of my life, I would never move her. Perhaps we would always remain in the café-conversation phase, and perhaps even that fragile arrangement wouldn't last as long as I imagined. Years from now, when I'm very old, looking back — how sad that would be. No matter how happy I was in Chuchu's presence, the moment this thought crossed my mind, grief was always right behind it.

"Come on, what are you spacing out about?" Chuchu's gentle voice pulled me back. We walked out of the café one after the other, heading for our destination. In this landlocked city, the only place to see fish — aside from the terrified ones in restaurant tanks — was the aquarium.

"Isn't it too late to go now?" Chuchu looked worriedly at the setting sun dropping behind buildings outside the taxi window.

"I don't know," I said. "Let's go and see. Even if we can't see the fish, we can see the aquarium itself."

"Do you go often?"

"Actually, I've never been. I've passed by a few times and liked the feeling it gave off — the sense of the ocean. I do like the sea, genuinely."

"Nonsense," Chuchu said. "You grew up by the Yellow River."

"That's different. The Yellow River has grandeur, but it doesn't feel like water, not really. Not like the gentle rivers of Jiangnan, not like the open sea. Maybe after roaring across the dry plateau for so long, it forgot what being water was supposed to feel like."

"You're reaching," Chuchu said. "All this Jiangnan and ocean talk is just in your head. You had a real river right there, and instead you chased some imaginary ideal of water. That doesn't sound like a very happy childhood."

"It's not imaginary. The first time I saw Jiangnan, I was on a train. I woke up one morning and there they were — white houses surrounded by patches of water, a pavilion on a small lake, the sun rising slowly on one side of the tracks. I thought: this is what real water looks like, gentle and embracing. And only a place like this could produce someone like Chuchu — a Jiangnan woman from Dai Wangshu's *Rain Alley*, fragrant as lilac and touched with sorrow."

"Flattery. You didn't even know me then."

"Time can take detours," I admitted — basically confessing I was making things up as I went. I always said things to Chuchu that sounded like flattery. To me, every word was sincere — I just couldn't find plainer ways to say them. Even to my own ears, it sounded glib. But the feeling was real, and explaining that only made things worse. After a few failed attempts, I gave up — she'd see it eventually. I went on: "Even back then, I was certain that someday I'd meet a woman like Chuchu. It's just that" — I squinted and made a pained face, imitating a character from a movie — "I guessed how it would begin, but I didn't guess the ending." Chuchu pretended not to notice.

Before we knew it, we were at the aquarium entrance. The sky was remarkably blue. The towering building rose above us like a great ship sailing through it.`,
  },
]

async function main() {
  console.log('Inserting 5 articles into Supabase...\n')

  for (const article of articles) {
    const now = new Date().toISOString()
    const record = {
      ...article,
      reading_time_min: calcReadingTime(article.content_zh, article.content_en),
      view_count: 0,
      created_at: now,
      updated_at: now,
    }

    // Check if slug exists
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', article.slug)
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('articles')
        .update(record)
        .eq('id', existing.id)
      if (error) {
        console.log(`✗ ${article.slug}: ${error.message}`)
      } else {
        console.log(`↻ ${article.slug} (updated)`)
      }
    } else {
      // Insert new
      const { error } = await supabase.from('articles').insert(record)
      if (error) {
        console.log(`✗ ${article.slug}: ${error.message}`)
      } else {
        console.log(`✓ ${article.slug}`)
      }
    }
  }

  console.log('\nDone! All articles inserted as drafts.')
}

main().catch(console.error)
