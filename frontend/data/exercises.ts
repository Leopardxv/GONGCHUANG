export type ExerciseDifficulty = "基础" | "进阶" | "综合";

export interface ExerciseStep {
  id: string;
  title: string;
  instruction: string;
  hint: string;
  match: string[];
}

export interface TextbookExercise {
  id: string;
  chapter: string;
  textbookPage: number;
  sourceTitle: string;
  title: string;
  summary: string;
  objective: string;
  difficulty: ExerciseDifficulty;
  estimatedMinutes: number;
  commands: string[];
  steps: ExerciseStep[];
}

export const textbookExercises: TextbookExercise[] = [
  {
    id: "ch2-docker-deploy",
    chapter: "2.5.3",
    textbookPage: 40,
    sourceTitle: "Docker Container Deployment",
    title: "Docker 容器部署与运行",
    summary: "对应教材 Ch2 中的 Docker 容器部署，拉取 openEuler 并启动运行。",
    objective: "学习拉取 openEuler 官方镜像，并以交互式方式启动并进入容器后台。",
    difficulty: "基础",
    estimatedMinutes: 8,
    commands: ["docker pull", "docker run", "docker exec"],
    steps: [
      {
        id: "pull",
        title: "拉取 openEuler 镜像",
        instruction: "拉取 openEuler 官方的 24.03-lts 镜像。",
        hint: "示例：docker pull openeuler/openeuler:24.03-lts",
        match: ["docker pull openeuler/openeuler:24.03-lts"],
      },
      {
        id: "run",
        title: "后台启动容器",
        instruction: "使用后台交互模式启动 openEuler24 容器并指定 hostname。",
        hint: "示例：docker run -tid --name openEuler24 --hostname=openEuler24 openeuler/openeuler:24.03-lts",
        match: ["docker run -tid", "--name openEuler24", "openeuler/openeuler:24.03-lts"],
      },
      {
        id: "exec",
        title: "进入容器交互终端",
        instruction: "通过 docker exec 命令开启容器 bash 终端交互。",
        hint: "示例：docker exec -it openEuler24 bash",
        match: ["docker exec -it openEuler24 bash", "docker exec -it openEuler24 /bin/bash"],
      },
    ],
  },
  {
    id: "ch3-basic-cli",
    chapter: "3.2.4-3.2.5",
    textbookPage: 52,
    sourceTitle: "Command Usage and Help",
    title: "命令行结构与系统帮助",
    summary: "对应教材 Ch3 中的命令行语法规范，获取命令行的参数和手册帮助。",
    objective: "理解 options/arguments 的命令行规范，并练习使用 man 查阅手册。",
    difficulty: "基础",
    estimatedMinutes: 5,
    commands: ["ls", "man", "pwd"],
    steps: [
      {
        id: "ls-params",
        title: "运行含参数的命令",
        instruction: "列出 /usr 目录下的文件，并指定按时间排序（-t）及启用颜色指示。",
        hint: "示例：ls -t --color /usr",
        match: ["ls -t --color /usr", "ls --color -t /usr"],
      },
      {
        id: "pwd-basic",
        title: "检查当前路径",
        instruction: "使用 pwd 查询当前的工作目录绝对路径。",
        hint: "示例：pwd",
        match: ["pwd"],
      },
      {
        id: "man-help",
        title: "查阅命令手册",
        instruction: "使用 man 查看 ls 命令的官方用法文档（在终端中按 q 退出手册）。",
        hint: "示例：man ls",
        match: ["man ls"],
      },
    ],
  },
  {
    id: "ch3-directory-manip",
    chapter: "3.3.1",
    textbookPage: 61,
    sourceTitle: "Directory Manipulation",
    title: "目录切换与文件夹树建立",
    summary: "对应教材 Ch3 中的 cd、mkdir 目录操作，学习路径解析与多层级目录创建。",
    objective: "掌握 cd 目录切换，练习 mkdir 参数及 du 命令测量空间大小。",
    difficulty: "基础",
    estimatedMinutes: 8,
    commands: ["cd", "mkdir", "pwd", "du"],
    steps: [
      {
        id: "cd-toggle",
        title: "切换工作目录",
        instruction: "进入系统临时目录 /tmp 并查看其当前路径。",
        hint: "示例：cd /tmp && pwd",
        match: ["cd /tmp", "pwd"],
      },
      {
        id: "mkdir-nested",
        title: "建立多层级目录",
        instruction: "使用 mkdir 创建多级子目录，要求显示创建过程并将子目录命名为 /tmp/foo/bar_a 与 /tmp/foo/bar_b。",
        hint: "示例：mkdir -pv /tmp/foo/bar_{a,b}",
        match: ["mkdir -pv /tmp/foo/bar_", "mkdir -vp /tmp/foo/bar_"],
      },
      {
        id: "du-check",
        title: "分析磁盘使用情况",
        instruction: "查看 /usr/src 目录占用的磁盘深度为 1 的空间，使用人类可读格式。",
        hint: "示例：du -hd1 /usr/src",
        match: ["du -hd1 /usr/src", "du -h -d 1 /usr/src", "du -d 1 -h /usr/src"],
      },
    ],
  },
  {
    id: "ch3-file-viewing",
    chapter: "3.3.2",
    textbookPage: 64,
    sourceTitle: "File Viewing",
    title: "文本查看与统计工具",
    summary: "对应教材 Ch3 中的 cat、less、tail 以及管道 wc 工具配合查看文本。",
    objective: "理解不同文本查看工具的区别，练习行数统计与列数据提取。",
    difficulty: "基础",
    estimatedMinutes: 8,
    commands: ["cat", "tail", "cut", "wc"],
    steps: [
      {
        id: "cat-view",
        title: "查看系统发行版本",
        instruction: "查看系统的 /etc/os-release 文件确认 Linux 系统信息。",
        hint: "示例：cat /etc/os-release",
        match: ["cat /etc/os-release"],
      },
      {
        id: "tail-passwd",
        title: "查看账号文件尾部",
        instruction: "显示 /etc/passwd 账户文件的最后 5 行内容。",
        hint: "示例：tail -n 5 /etc/passwd",
        match: ["tail -n 5 /etc/passwd", "tail -n5 /etc/passwd"],
      },
      {
        id: "wc-count",
        title: "统计系统命令个数",
        instruction: "用 ls -A 列出 /bin 目录下所有文件并通过 wc -l 管道统计总个数。",
        hint: "示例：ls -A /bin/ | wc -l",
        match: ["ls -A /bin/ | wc -l", "ls -A /bin | wc -l"],
      },
    ],
  },
  {
    id: "ch3-file-management",
    chapter: "3.3.3",
    textbookPage: 71,
    sourceTitle: "File Management",
    title: "文件备份与归档压缩",
    summary: "对应教材 Ch3 中的 cp、mkdir 和 tar 压缩工具进行系统日常备份。",
    objective: "掌握文件夹的安全拷贝、归档以及多文件的解压缩提取过程。",
    difficulty: "进阶",
    estimatedMinutes: 10,
    commands: ["mkdir", "cp", "tar"],
    steps: [
      {
        id: "make-bak",
        title: "创建备份目录",
        instruction: "在用户家目录下创建一个名为 bak 的文件夹。",
        hint: "示例：mkdir ~/bak",
        match: ["mkdir ~/bak", "mkdir -p ~/bak"],
      },
      {
        id: "cp-recurse",
        title: "保留属性复制目录",
        instruction: "将 /etc/profile.d/ 整个目录拷贝至 ~/bak 下，要求保留文件属性且仅在源文件更新时才进行复制。",
        hint: "示例：cp -pru /etc/profile.d/ ~/bak",
        match: ["cp -pru /etc/profile.d", "cp -r -u -p /etc/profile.d"],
      },
      {
        id: "tar-gz",
        title: "打包并压缩文件",
        instruction: "使用 tar 工具将整个 /etc 目录打包并使用 gzip 压缩为 etc.tar.gz。",
        hint: "示例：tar -czvf etc.tar.gz /etc",
        match: ["tar -czvf etc.tar.gz /etc", "tar -czf etc.tar.gz /etc"],
      },
    ],
  },
  {
    id: "ch3-file-search",
    chapter: "3.3.4",
    textbookPage: 75,
    sourceTitle: "File Search",
    title: "多维文件查找定位",
    summary: "对应教材 Ch3 中的 which、locate 和 find 系统查找，定位命令和文件。",
    objective: "掌握命令查找、定位数据库查询 and 强大的 find 多属性条件文件查找。",
    difficulty: "进阶",
    estimatedMinutes: 10,
    commands: ["which", "locate", "find"],
    steps: [
      {
        id: "which-cmd",
        title: "定位可执行文件路径",
        instruction: "查找 pwd 和 tar 这两个系统工具的对应二进制执行文件绝对路径。",
        hint: "示例：which pwd tar",
        match: ["which pwd tar"],
      },
      {
        id: "locate-db",
        title: "快速数据库检索",
        instruction: "利用系统 locate 检索包含 pwd 字符的所有系统路径位置。",
        hint: "提示：如果是新系统需先运行 sudo updatedb 更新数据库，然后运行 locate pwd",
        match: ["locate pwd"],
      },
      {
        id: "find-size",
        title: "大小与深度过滤查找",
        instruction: "在 /var/log/ 目录下搜寻大小超过 10M 且类型为普通文件的项并将其删除。",
        hint: "示例：find /var/log/ -size +10M -type f -delete",
        match: ["find /var/log", "-size +10M", "-type f", "-delete"],
      },
    ],
  },
  {
    id: "ch3-system-query",
    chapter: "3.3.5",
    textbookPage: 78,
    sourceTitle: "System Information Query",
    title: "资源与系统信息体检",
    summary: "对应教材 Ch3 中的 uname、df、free 命令，查询系统内核版本、可用分区空间与内存占用状态。",
    objective: "理解系统的主要硬件和运行指标获取方式，为性能调优提供支撑数据。",
    difficulty: "基础",
    estimatedMinutes: 6,
    commands: ["uname", "df", "free"],
    steps: [
      {
        id: "uname-info",
        title: "读取内核与发行架构",
        instruction: "读取系统所有硬件及 Linux 操作系统内核详细版本信息。",
        hint: "示例：uname -a",
        match: ["uname -a"],
      },
      {
        id: "df-disk",
        title: "检查磁盘分区挂载",
        instruction: "以人类易读的格式查看系统根目录（/）的磁盘占用情况。",
        hint: "示例：df -h /",
        match: ["df -h /"],
      },
      {
        id: "free-mem",
        title: "实时可用内存体检",
        instruction: "以人类易读的格式（带总量汇总）输出系统当前 RAM 内存与 Swap 交换分区的占用量。",
        hint: "示例：free -ht",
        match: ["free -ht", "free -h -t"],
      },
    ],
  },
  {
    id: "ch3-command-comb",
    chapter: "3.4.2-3.4.4",
    textbookPage: 88,
    sourceTitle: "Command Chain and Group",
    title: "逻辑控制链条与子 Shell",
    summary: "对应教材 Ch3 中的逻辑运算符 (&&, ||) 及小括号命令组的实践。",
    objective: "掌握命令逻辑组合的执行顺序机制，以及命令组在独立子 Shell 中的运行行为。",
    difficulty: "进阶",
    estimatedMinutes: 8,
    commands: ["cd", "mkdir", "pwd"],
    steps: [
      {
        id: "chain-and",
        title: "使用逻辑与执行命令",
        instruction: "进入 /tmp 目录，若成功则创建新子目录 mytest，成功创建后列出 mytest 目录详情。",
        hint: "示例：cd /tmp && mkdir -p mytest && ls -d mytest",
        match: ["cd /tmp && mkdir -p mytest && ls -d mytest", "cd /tmp && mkdir -p mytest && ls -ld mytest"],
      },
      {
        id: "subshell",
        title: "命令组隔离环境",
        instruction: "在一对括号构成的命令组中先切换到 /tmp 再运行 pwd 打印，结束后再次打印当前工作路径（验证主 Shell 的工作路径未被污染）。",
        hint: "示例：(cd /tmp; pwd) && pwd",
        match: ["(cd /tmp; pwd) && pwd", "(cd /tmp && pwd) && pwd"],
      },
    ],
  },
  {
    id: "ch3-redirection-pipe",
    chapter: "3.4.5-3.4.6",
    textbookPage: 90,
    sourceTitle: "Redirection and Pipes",
    title: "重定向与管道数据流",
    summary: "对应教材 Ch3 Shell 中的重定向、wc、tee 与管道组合。",
    objective: "掌握将命令输出写入文件、统计文本内容，并用管道串联多个命令。",
    difficulty: "基础",
    estimatedMinutes: 8,
    commands: ["echo", "wc", "tee", "cat", "grep"],
    steps: [
      {
        id: "redirect",
        title: "写入文件",
        instruction: "使用 echo 和 > 创建 hello.txt，内容包含 openEuler。",
        hint: "示例：echo \"Hello, openEuler\" > hello.txt",
        match: ["> hello.txt", "echo"],
      },
      {
        id: "count",
        title: "统计内容",
        instruction: "用 wc 统计 hello.txt 的行数、单词数和字符数。",
        hint: "示例：wc < hello.txt 或 wc hello.txt",
        match: ["wc < hello.txt", "wc hello.txt"],
      },
      {
        id: "pipe",
        title: "管道过滤",
        instruction: "用管道把 hello.txt 的内容交给 grep，筛出 openEuler。",
        hint: "示例：cat hello.txt | grep openEuler",
        match: ["| grep", "grep openEuler"],
      },
    ],
  },
  {
    id: "ch4-file-operations",
    chapter: "4.2.4",
    textbookPage: 117,
    sourceTitle: "Example 4.1: File System Operations",
    title: "文件树与目录操作",
    summary: "对应教材 Ch4 文件管理示例，将挂载/文件树概念转化为普通用户可完成的目录练习。",
    objective: "理解 Linux 文件树组织方式，练习 mkdir、cp、mv、find 等基础文件管理命令。",
    difficulty: "基础",
    estimatedMinutes: 10,
    commands: ["mkdir", "touch", "cp", "mv", "find", "ls"],
    steps: [
      {
        id: "workspace",
        title: "建立实验目录",
        instruction: "创建 ~/linux-lab/files，并进入该目录。",
        hint: "示例：mkdir -p ~/linux-lab/files && cd ~/linux-lab/files",
        match: ["mkdir -p ~/linux-lab/files", "cd ~/linux-lab/files"],
      },
      {
        id: "create-copy",
        title: "创建并复制文件",
        instruction: "创建 note.txt，并复制为 note.bak。",
        hint: "示例：touch note.txt && cp note.txt note.bak",
        match: ["touch note.txt", "cp note.txt note.bak"],
      },
      {
        id: "inspect",
        title: "查看文件树",
        instruction: "使用 ls 或 find 查看当前目录文件。",
        hint: "示例：find . -maxdepth 1 -type f",
        match: ["find .", "ls"],
      },
    ],
  },
  {
    id: "ch4-process-monitor",
    chapter: "4.4.7",
    textbookPage: 138,
    sourceTitle: "Example 4.3: Process Monitoring and Management",
    title: "进程查看与过滤",
    summary: "对应教材 Ch4 ps/top 示例，训练用 ps 和 grep 定位进程。",
    objective: "理解进程列表、PID、用户进程与命令过滤的基本方法。",
    difficulty: "基础",
    estimatedMinutes: 8,
    commands: ["ps", "grep", "sleep", "kill"],
    steps: [
      {
        id: "start-process",
        title: "启动后台进程",
        instruction: "启动一个后台 sleep 进程，作为观察对象。",
        hint: "示例：sleep 300 &",
        match: ["sleep 300 &", "sleep"],
      },
      {
        id: "list-process",
        title: "查看进程",
        instruction: "使用 ps 查看当前用户相关进程。",
        hint: "示例：ps uf 或 ps aux",
        match: ["ps uf", "ps aux", "ps -"],
      },
      {
        id: "filter-process",
        title: "过滤目标",
        instruction: "用管道和 grep 找到 sleep 进程。",
        hint: "示例：ps aux | grep \"[s]leep\"",
        match: ["| grep", "grep \"[s]leep\"", "grep sleep"],
      },
    ],
  },
  {
    id: "ch5-text-search",
    chapter: "5.1.3-5.1.5",
    textbookPage: 152,
    sourceTitle: "Text Searching and Text Analysis",
    title: "grep、sort 与 uniq 文本分析",
    summary: "对应教材 Ch5 文本搜索与分析，将 grep、sort、uniq 组合成小型日志统计任务。",
    objective: "掌握文本过滤、排序和去重统计的命令组合。",
    difficulty: "进阶",
    estimatedMinutes: 12,
    commands: ["printf", "grep", "sort", "uniq", "wc"],
    steps: [
      {
        id: "make-log",
        title: "准备样例日志",
        instruction: "创建 access.log，写入多行包含 INFO、WARN、ERROR 的记录。",
        hint: "示例：printf \"INFO boot\\nERROR disk\\nWARN cpu\\nERROR net\\n\" > access.log",
        match: ["> access.log", "printf"],
      },
      {
        id: "grep-error",
        title: "筛选错误",
        instruction: "使用 grep 找出 access.log 中的 ERROR 行。",
        hint: "示例：grep ERROR access.log",
        match: ["grep ERROR access.log", "grep 'ERROR' access.log"],
      },
      {
        id: "count-level",
        title: "统计级别",
        instruction: "用管道组合 sort 和 uniq -c 统计日志级别出现次数。",
        hint: "示例：cut -d ' ' -f1 access.log | sort | uniq -c",
        match: ["sort | uniq -c", "uniq -c"],
      },
    ],
  },
  {
    id: "ch5-shell-script",
    chapter: "5.2.1",
    textbookPage: 164,
    sourceTitle: "Number-Guessing Game",
    title: "Shell 脚本创建与执行",
    summary: "对应教材 Ch5 number-guessing game，引导学生完成脚本文件、权限和运行流程。",
    objective: "理解 shebang、脚本权限和 bash 执行方式。",
    difficulty: "综合",
    estimatedMinutes: 15,
    commands: ["cat", "chmod", "bash", "./guess.sh"],
    steps: [
      {
        id: "create-script",
        title: "创建脚本",
        instruction: "创建 guess.sh，并写入 shebang 与至少一条 echo 输出。",
        hint: "示例：cat > guess.sh，然后输入 #!/bin/sh 与 echo \"hello\"，最后 Ctrl+D",
        match: ["cat > guess.sh", "vi guess.sh", "nano guess.sh"],
      },
      {
        id: "chmod",
        title: "添加执行权限",
        instruction: "给 guess.sh 添加执行权限。",
        hint: "示例：chmod +x guess.sh",
        match: ["chmod +x guess.sh", "chmod"],
      },
      {
        id: "run-script",
        title: "运行脚本",
        instruction: "直接执行脚本，或用 bash/sh 执行脚本。",
        hint: "示例：./guess.sh 或 bash guess.sh",
        match: ["./guess.sh", "bash guess.sh", "sh guess.sh"],
      },
    ],
  },
  {
    id: "ch7-network-diagnosis",
    chapter: "7.3.5",
    textbookPage: 256,
    sourceTitle: "Network Diagnosis",
    title: "网络连通性诊断",
    summary: "对应教材 Ch7 网络诊断，练习 ip、ping、curl 等安全可执行命令。",
    objective: "掌握网络接口、路由和 HTTP 连通性的基础排查思路。",
    difficulty: "进阶",
    estimatedMinutes: 10,
    commands: ["ip", "ping", "curl", "ss"],
    steps: [
      {
        id: "ip-address",
        title: "查看网络地址",
        instruction: "查看当前容器网络地址或路由信息。",
        hint: "示例：ip addr 或 ip route",
        match: ["ip addr", "ip a", "ip route", "ip r"],
      },
      {
        id: "ping",
        title: "测试连通性",
        instruction: "使用 ping 发送少量探测包。",
        hint: "示例：ping -c 2 127.0.0.1",
        match: ["ping -c", "ping"],
      },
      {
        id: "curl",
        title: "检查 HTTP",
        instruction: "用 curl 查看 HTTP 响应头或请求结果。",
        hint: "示例：curl -I https://example.com",
        match: ["curl -I", "curl"],
      },
    ],
  },
];

export function exercisesForPage(page: number) {
  return textbookExercises.filter((exercise) => Math.abs(exercise.textbookPage - page) <= 2);
}

export function getExerciseById(id: string | null | undefined) {
  if (!id) return null;
  return textbookExercises.find((exercise) => exercise.id === id) ?? null;
}

