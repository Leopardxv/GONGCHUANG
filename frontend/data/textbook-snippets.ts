export interface TextbookSnippet {
  id: string;
  page: number;
  section: string;
  title: string;
  description: string;
  code: string;
  language: string;
}

export const textbookSnippets: TextbookSnippet[] = [
  /* ══════ Ch2: Container Deployment ══════ */
  {
    id: "snip-ch2-strcpy",
    page: 23,
    section: "2.1",
    title: "C 语言 strcpy 标准库实现",
    description: "展示 glibc 中 strcpy 函数的底层 C 语言核心代码实现。",
    code: `char *strcpy(char *dest, const char *src)
{
    char *s = src;
    const ptrdiff_t off = dest - s - 1;
    do {
        s[off] = *s;
    } while (*s++ != '\\0');
    return dest;
}`,
    language: "c",
  },
  {
    id: "snip-ch2-docker-pull",
    page: 40,
    section: "2.5.3",
    title: "拉取 openEuler 官方容器镜像",
    description: "从官方仓库拉取最新 24.03-lts 的 openEuler 镜像。",
    code: `docker pull openeuler/openeuler:24.03-lts`,
    language: "bash",
  },
  {
    id: "snip-ch2-docker-run",
    page: 40,
    section: "2.5.3",
    title: "运行后台交互式 openEuler 容器",
    description: "以交互后台模式启动容器，并分配名称 and 网络主机名。",
    code: `docker run -tid --name openEuler24 --hostname=openEuler24 openeuler/openeuler:24.03-lts`,
    language: "bash",
  },
  {
    id: "snip-ch2-docker-exec",
    page: 40,
    section: "2.5.3",
    title: "进入运行中的 openEuler 容器终端",
    description: "进入已启动容器的 bash 终端以开始使用 openEuler 系统。",
    code: `docker exec -it openEuler24 bash`,
    language: "bash",
  },

  /* ══════ Ch3: Getting Started with openEuler ══════ */
  {
    id: "snip-ch3-cockpit",
    page: 49,
    section: "3.2.1",
    title: "启用 Cockpit 网页控制台",
    description: "在 openEuler 系统中激活并启动 Cockpit Web 管理界面服务。",
    code: `systemctl enable --now cockpit.socket`,
    language: "bash",
  },
  {
    id: "snip-ch3-adduser",
    page: 49,
    section: "3.2.2",
    title: "创建系统用户与密码设置",
    description: "添加 ict 用户并分配 wheel 管理组，以及设定系统登录密码。",
    code: `# 添加用户并归属管理组
adduser -g wheel ict

# 修改密码
passwd ict

# 退出当前会话
exit`,
    language: "bash",
  },
  {
    id: "snip-ch3-date",
    page: 52,
    section: "3.2.4",
    title: "显示当前日期时间 (date)",
    description: "在终端中直接运行 date 命令，输出当前系统时间和日期。",
    code: `[ict@openEuler24 ~]$ date
Mon Jan  2 18:01:31 CST 2025`,
    language: "bash",
  },
  {
    id: "snip-ch3-command-usage",
    page: 52,
    section: "3.2.4",
    title: "命令行结构示例",
    description: "展示带有选项和参数的典型 Linux 命令行结构。",
    code: `[ict@openEuler24 ~]$ ls -t --color /usr`,
    language: "bash",
  },
  {
    id: "snip-ch3-file-multiline",
    page: 53,
    section: "3.2.4",
    title: "多行命令输入 (续行符 \\)",
    description: "使用反斜杠 \\ 将单条命令拆分成多行输入，提高可读性。",
    code: `[ict@openEuler24 ~]$ file \\
> /usr/share/grub/grub-mkconfig_lib
/usr/share/grub/grub-mkconfig_lib: ASCII text`,
    language: "bash",
  },
  {
    id: "snip-ch3-date-help",
    page: 54,
    section: "3.2.4",
    title: "获取命令的内建帮助信息 (--help)",
    description: "运行带 --help 选项的命令来输出详细的使用说明及可用参数列表。",
    code: `[ict@openEuler24 ~]$ date --help
Usage: date [OPTION]... [+FORMAT]
  or:  date [-u|--utc|--universal] [MMDDhhmm[[CC]YY][.ss]]
Display date and time in the given FORMAT.`,
    language: "bash",
  },
  {
    id: "snip-ch3-dnf-install-help",
    page: 55,
    section: "3.2.5",
    title: "安装系统帮助文档包",
    description: "使用 dnf 包管理器安装核心工具和二进制工具的帮助手册。",
    code: `[ict@openEuler24 ~]$ sudo dnf install -y coreutils-help binutils-help`,
    language: "bash",
  },
  {
    id: "snip-ch3-dnf-install-help-dynamic",
    page: 55,
    section: "3.2.5",
    title: "动态查询并安装对应帮助包",
    description: "通过 rpm 查询命令所属包名并动态组合安装对应的 help 帮助包。",
    code: `[ict@openEuler24 ~]$ sudo dnf install -y \`rpm -qf \\\`which dnf\\\` | sed 's/-[0-9].*//'\`-help`,
    language: "bash",
  },
  {
    id: "snip-ch3-man-ls",
    page: 55,
    section: "3.2.5",
    title: "查询系统命令手册 (man)",
    description: "在系统联机帮助中获取 ls 命令的全部手册和参数说明（在其中按 q 退出）。",
    code: `[ict@openEuler24 ~]$ man ls`,
    language: "bash",
  },
  {
    id: "snip-ch3-ls-lh",
    page: 59,
    section: "3.3.1",
    title: "查看详尽目录列表 (Human-readable)",
    description: "使用人类易读格式（带 K/M/G 单位）输出根目录的文件和目录详细信息。",
    code: `[ict@openEuler24 ~]$ ls -lh /`,
    language: "bash",
  },
  {
    id: "snip-ch3-ls-redir",
    page: 60,
    section: "3.3.1",
    title: "命令输出重定向至文本",
    description: "将 ls 的执行结果保存到文本文件 ls_output.txt 中，而非显示于屏幕。",
    code: `[ict@openEuler24 ~]$ ls > ls_output.txt`,
    language: "bash",
  },
  {
    id: "snip-ch3-pwd-p",
    page: 61,
    section: "3.3.1",
    title: "查看当前物理路径",
    description: "使用 pwd 和 pwd -P 分别查看当前符号路径和真实物理路径。",
    code: `# 查看逻辑路径
[ict@openEuler24 bin]$ pwd
/bin

# 查看解析软链接后的真实物理路径
[ict@openEuler24 bin]$ pwd -P
/usr/bin`,
    language: "bash",
  },
  {
    id: "snip-ch3-mkdir-pv",
    page: 62,
    section: "3.3.1",
    title: "递归且可视创建多级子目录",
    description: "使用 mkdir 创建多层嵌套子目录，并开启打印创建细节与括号展开语法。",
    code: `[ict@openEuler24 ~]$ mkdir -pv /tmp/foo/bar_{a,b}`,
    language: "bash",
  },
  {
    id: "snip-ch3-du-hd1",
    page: 62,
    section: "3.3.1",
    title: "测量文件夹占用空间",
    description: "分析 /usr/src 目录下子文件的空间使用量，限制扫描深度为 1。",
    code: `[ict@openEuler24 ~]$ du -hd1 /usr/src`,
    language: "bash",
  },
  {
    id: "snip-ch3-ls-bin",
    page: 63,
    section: "3.3.1",
    title: "查看 bin 目录的软链接指向",
    description: "查看 /bin 目录的链接状态，表明其是 /usr/bin 的符号链接。",
    code: `[ict@openEuler24 ~]$ ls -l /bin`,
    language: "bash",
  },
  {
    id: "snip-ch3-cat-os",
    page: 64,
    section: "3.3.2",
    title: "查看系统版本信息",
    description: "使用 cat 读取 openEuler 发行版配置文本的全部内容。",
    code: `[ict@openEuler24 ~]$ cat /etc/os-release`,
    language: "bash",
  },
  {
    id: "snip-ch3-less-help",
    page: 65,
    section: "3.3.2",
    title: "配合 less 实现流控制翻页",
    description: "把大量的帮助或文件列表通过管道过滤给 less，防止滚屏过快。",
    code: `# 翻页阅读 ls 的帮助内容
[ict@openEuler24 ~]$ ls --help | less

# 翻页查看根目录列表
[ict@openEuler24 ~]$ ls -lh / | less`,
    language: "bash",
  },
  {
    id: "snip-ch3-tail-passwd",
    page: 65,
    section: "3.3.2",
    title: "查看文件末尾行内容",
    description: "使用 tail 截取 /etc/passwd 用户文件的最后 5 行。",
    code: `[ict@openEuler24 ~]$ tail -n5 /etc/passwd`,
    language: "bash",
  },
  {
    id: "snip-ch3-cut-passwd",
    page: 66,
    section: "3.3.2",
    title: "剪切提取特定列数据",
    description: "以 ':' 为分隔符，裁切 /etc/passwd 提取用户名（第一列）和家目录路径（第六列）。",
    code: `[ict@openEuler24 ~]$ cut -d: -f1,6 /etc/passwd`,
    language: "bash",
  },
  {
    id: "snip-ch3-wc-count",
    page: 66,
    section: "3.3.2",
    title: "统计系统文件总个数",
    description: "列出 /bin 文件夹下所有项并用管道交给 wc -l 统计总行数。",
    code: `[ict@openEuler24 ~]$ ls -A /bin/ | wc -l`,
    language: "bash",
  },
  {
    id: "snip-ch3-nl-os",
    page: 66,
    section: "3.3.2",
    title: "显示带行号的文本",
    description: "利用 nl 命令为 /etc/os-release 文件加行号输出。",
    code: `[ict@openEuler24 foo]$ nl /etc/os-release`,
    language: "bash",
  },
  {
    id: "snip-ch3-hexdump",
    page: 68,
    section: "3.3.2",
    title: "二进制十六进制查看文件",
    description: "使用 hexdump -C 查看文本文件的底层二进制及 ASCII 显示。",
    code: `[ict@openEuler24 ~]$ hexdump -C /etc/passwd`,
    language: "bash",
  },
  {
    id: "snip-ch3-lsof-u",
    page: 69,
    section: "3.3.2",
    title: "列出用户打开的文件",
    description: "使用 lsof 查看 ict 用户当前占用的所有进程与文件描述符。",
    code: `[ict@openEuler24 ~]$ lsof -u ict`,
    language: "bash",
  },
  {
    id: "snip-ch3-file-pwd",
    page: 69,
    section: "3.3.2",
    title: "查看可执行程序的文件类型",
    description: "使用 file 命令探测 /usr/bin/pwd 文件的详细架构（如 ELF 64 位）。",
    code: `[ict@openEuler24 ~]$ file /usr/bin/pwd`,
    language: "bash",
  },
  {
    id: "snip-ch3-cp-pru",
    page: 71,
    section: "3.3.3",
    title: "安全复制与目录备份",
    description: "递归复制目录，同时保留权限、时间属性，并仅在源文件更新时进行覆盖更新。",
    code: `# 创建备份目录
[ict@openEuler24 ~]$ mkdir ~/bak

# 复制 profile 文件夹
[ict@openEuler24 ~]$ cp -pru .ssh/ /etc/profile.d/ bak`,
    language: "bash",
  },
  {
    id: "snip-ch3-ln-s-simple",
    page: 73,
    section: "3.3.3",
    title: "创建软链接 (符号链接)",
    description: "使用 ln -s 创建指向目标文件夹的快捷方式链接文件。",
    code: `ln -s /usr/local/bin ulb`,
    language: "bash",
  },
  {
    id: "snip-ch3-tar-gz",
    page: 74,
    section: "3.3.3",
    title: "Tar 备份打包与解压归档",
    description: "使用 tar 对目录进行 gzip 压缩打包，并能够指定解压路径。",
    code: `# 备份打包 /etc 目录
[ict@openEuler24 ~]$ tar -czvf etc.tar.gz /etc

# 解压 etc.tar.gz 到 /tmp 目录
[ict@openEuler24 ~]$ tar -xzvf etc.tar.gz -C /tmp`,
    language: "bash",
  },
  {
    id: "snip-ch3-which-pwd",
    page: 75,
    section: "3.3.4",
    title: "查询可执行命令物理路径",
    description: "使用 which 寻找命令行工具 pwd 和 tar 的可执行文件二进制物理存储路径。",
    code: `[ict@openEuler24 ~]$ which pwd tar`,
    language: "bash",
  },
  {
    id: "snip-ch3-locate-pwd",
    page: 76,
    section: "3.3.4",
    title: "基于数据库的文件快速查询",
    description: "利用 mlocate 快速从文件系统索引数据库里找出包含 pwd 名字的匹配路径。",
    code: `[ict@openEuler24 ~]$ locate pwd`,
    language: "bash",
  },
  {
    id: "snip-ch3-whereis-tar",
    page: 76,
    section: "3.3.4",
    title: "查找命令、源码及手册页路径",
    description: "利用 whereis 定位 tar 命令的执行文件、man 手册文件位置，以及 stdio.h 头文件路径。",
    code: `[ict@openEuler24 ~]$ whereis tar stdio.h`,
    language: "bash",
  },
  {
    id: "snip-ch3-find-mtime",
    page: 77,
    section: "3.3.4",
    title: "find 高级条件搜索与删除",
    description: "使用 find 配合时间、文件类型、逻辑运算符及删除/命令执行动作的高级搜索命令。",
    code: `# 查找 24 小时内更新过的 .c 与 .h 文件并使用 tar 备份
[ict@openEuler24 ~]$ find -mtime -1 \( -name "*.c" -or -name "*.h" \) -exec tar -rvf latest.tgz {} \;

# 查找 /var/log 目录下大于 10M 且比 ttt 旧的文件直接删除
[ict@openEuler24 ~]$ find /var/log/ \! -newer ttt -size +10M -type f -delete`,
    language: "bash",
  },
  {
    id: "snip-ch3-find-broken-links",
    page: 77,
    section: "3.3.4",
    title: "查找失效的软链接 (Broken links)",
    description: "在 /usr 目录前三层中，搜索并打印所有指向的物理文件已不存在的损坏软链接。",
    code: `[ict@openEuler24 ~]$ find /usr -type l -maxdepth 3 -exec test ! -e {} \\; -print`,
    language: "bash",
  },
  {
    id: "snip-ch3-uname-a",
    page: 78,
    section: "3.3.5",
    title: "查询系统内核详细信息",
    description: "使用 uname -a 获取内核版本号、编译时间、操作系统版本与 CPU 架构。",
    code: `[ict@openEuler24 ~]$ uname -a`,
    language: "bash",
  },
  {
    id: "snip-ch3-who-h",
    page: 79,
    section: "3.3.6",
    title: "监控系统在线会话与登录历史",
    description: "使用 who 检查当前系统活跃会话，利用 last 查看账号最近的登录记录历史。",
    code: `# 查看当前在线用户会话
[ict@openEuler24 ~]$ who -H

# 查看 root 用户的历史登录记录
[ict@openEuler24 ~]$ last root`,
    language: "bash",
  },
  {
    id: "snip-ch3-df-free",
    page: 80,
    section: "3.3.6",
    title: "磁盘分区与物理内存使用量体检",
    description: "df 查看文件系统的容量挂载占用，free -ht 展示内存与 Swap 交换区总量情况。",
    code: `# 查看根分区的磁盘使用状态
[ict@openEuler24 bin]$ df -h /

# 查看系统可用内存和交换空间总览
[ict@openEuler24 ~]$ free -ht`,
    language: "bash",
  },
  {
    id: "snip-ch3-timedatectl",
    page: 81,
    section: "3.3.6",
    title: "系统时间与时区设置 (timedatectl)",
    description: "使用 timedatectl 调整系统日期、设定时区以及开启网络时间同步 (NTP)。",
    code: `# 调整系统时间
timedatectl set-time "2025-01-01 00:00:00"

# 设定系统时区为上海
timedatectl set-timezone "Asia/Shanghai"

# 开启 NTP 网络时间同步
timedatectl set-ntp yes`,
    language: "bash",
  },
  {
    id: "snip-ch3-env-path",
    page: 84,
    section: "3.4.2",
    title: "查看环境变量与 PATH 路径",
    description: "使用 env 命令输出系统环境变量，使用 echo 打印命令搜寻路径变量 PATH。",
    code: `# 查看所有系统环境变量
[ict@openEuler24 ~]$ env | less

# 打印 PATH 命令路径
[ict@openEuler24 ~]$ echo $PATH`,
    language: "bash",
  },
  {
    id: "snip-ch3-type-find",
    page: 85,
    section: "3.4.2",
    title: "查找命令类型 (type find)",
    description: "使用 type 查看 find 命令当前是被解析为内建命令、别名还是外部二进制文件路径。",
    code: `[ict@openEuler24 ~]$ type find
find is /home/ict/bin/find`,
    language: "bash",
  },
  {
    id: "snip-ch3-export-path",
    page: 85,
    section: "3.4.2",
    title: "配置与导出环境变量",
    description: "使用 export 修改当前会话 PATH，并写入用户配置文件 .bashrc 永久生效。",
    code: `# 临时在当前会话 PATH 中追加新路径
[ict@openEuler24 ~]$ export PATH=/home/ict/tools/bin:$PATH

# 将 PATH 的追加规则永久写入用户的 bash 配置文件中
[ict@openEuler24 ~]$ echo "export PATH=/home/ict/tools/bin:\$PATH" >> ~/.bashrc

# 让刚才修改的 .bashrc 配置文件立即生效
[ict@openEuler24 ~]$ . ~/.bashrc`,
    language: "bash",
  },
  {
    id: "snip-ch3-wildcard",
    page: 86,
    section: "3.4.3",
    title: "通配符筛选目录",
    description: "利用通配符 * 匹配以 bin 结尾的系统目录。",
    code: `[ict@openEuler24 ~]$ ls -dl /*bin`,
    language: "bash",
  },
  {
    id: "snip-ch3-subst-chain",
    page: 88,
    section: "3.4.4",
    title: "命令逻辑连条与反引号替换",
    description: "组合 && 条件执行链条，以及反引号 \` \` 的命令结果替换效果。",
    code: `# 生成临时文件名称并打印
[ict@openEuler24 ~]$ tmpf=\`mktemp -u /tmp/tmp.XXXX\` && echo $tmpf

# 逻辑与：当前一条命令成功时才运行下一条命令
[ict@openEuler24 foo]$ pwd && mkdir /foo && pwd`,
    language: "bash",
  },
  {
    id: "snip-ch3-subshell-group",
    page: 89,
    section: "3.4.4",
    title: "小括号子 Shell 隔离执行",
    description: "用小括号 () 包裹的命令会在独立的子进程中执行，退出后不改变当前主会话工作目录。",
    code: `[ict@openEuler24 ~]$ (cd /tmp; pwd) && pwd`,
    language: "bash",
  },
  
  /* ══════ Ch3: Redirection and Pipes (Aligned) ══════ */
  {
    id: "snip-redirect-basic",
    page: 90,
    section: "3.4.5",
    title: "输出重定向基础",
    description: "使用 > 将命令输出写入文件，>> 追加内容，< 从文件读取输入。",
    code: `# 重定向标准输出与错误输出到不同位置
[ict@openEuler24 ~]$ echo "Hello, openEuler!" > hello.txt 2> /dev/null
[ict@openEuler22 ~]$ echo "Hello, openEuler!" &> hello.txt

# 查看文件内容
cat hello.txt`,
    language: "bash",
  },
  {
    id: "snip-ch3-redirect-input",
    page: 90,
    section: "3.4.5",
    title: "输入重定向与输入输出组合",
    description: "使用 < 运算符将文件内容作为命令的输入，以及将输入/输出重定向组合使用。",
    code: `# 使用文件内容作为标准输入
[ict@openEuler24 ~]$ wc < hello.txt

# 组合：从 hello.txt 读取输入，将微调后的统计结果输出到 wc.txt
[ict@openEuler24 ~]$ wc < hello.txt > wc.txt`,
    language: "bash",
  },
  {
    id: "snip-ch3-here-doc",
    page: 92,
    section: "3.4.5",
    title: "Here-Document 重定向输入",
    description: "使用 << EOF 将多行内容一次性追加重定向写入文本中。",
    code: `[ict@openEuler24 ~]$ cat << EOF >> hello.txt
> Hello, $(whoami)@$HOSTNAME
> EOF`,
    language: "bash",
  },
  {
    id: "snip-pipe-basic",
    page: 93,
    section: "3.4.6",
    title: "管道组合命令与 Tee 双流分支",
    description: "使用管道 | 串联流，并配合 tee 截取中间过程写入日志。",
    code: `# 用 tee 截获中间排序结果并加上行号写入文件
[ict@openEuler24 ~]$ cat /etc/passwd | sort | tee -a /tmp/passwd | nl > nlpasswd`,
    language: "bash",
  },
  {
    id: "snip-ch3-tar-pipe",
    page: 94,
    section: "3.4.6",
    title: "Tar 与压缩管道数据流",
    description: "使用管道将打包输出的 tar 字节流直接重定向输入给压缩命令，避免写中间临时文件。",
    code: `[ict@openEuler24 ~]$ tar -cvf bak.tar ~/bak | gzip > bak.tar.gz`,
    language: "bash",
  },
  {
    id: "snip-ch3-tar-pipe-xz",
    page: 94,
    section: "3.4.6",
    title: "Tar 与 xz 压缩管道数据流",
    description: "使用管道将打包输出的 tar 字节流直接重定向输入给 xz 压缩命令，避免写中间临时文件。",
    code: `[ict@openEuler24 ~]$ tar -cvf bak.tar ~/bak | xz > bak.tar.xz`,
    language: "bash",
  },
  {
    id: "snip-ch3-find-tar-pipe",
    page: 94,
    section: "3.4.6",
    title: "结合 find 与 tar 打包文件",
    description: "通过管道将 find 查找到的文件列表传递给 tar 打包归档（使用 -T - 从标准输入读取列表）。",
    code: `[ict@openEuler24 ~]$ find -type f -name "*.sh" | tar -cvf sh.tar -T -`,
    language: "bash",
  },
  {
    id: "snip-ch3-find-du-sort",
    page: 94,
    section: "3.4.6",
    title: "结合 find 与 du 进行容量分析",
    description: "查找所有 C 语言源文件，并用 du 统计大小并按容量升序排列。",
    code: `[ict@openEuler24 ~]$ find . -name "*.c" | du -ch | sort -k1 -n`,
    language: "bash",
  },
  {
    id: "snip-ch3-xargs-wc",
    page: 95,
    section: "3.4.6",
    title: "使用 xargs 构建参数执行",
    description: "通过 xargs 将搜寻出来的文件名称列表转化为具体参数，传给 wc 或 mv 命令执行。",
    code: `# 统计找到的所有代码文件行数总和
[ict@openEuler24 ~]$ find -type f \(-name "*.c" -or -name "*.h" \) | xargs wc -l

# 批量给 Shell 脚本增加 .bak 扩展名
[ict@openEuler24 ~]$ find . -maxdepth 1 -type f -name '*.sh' | xargs -I % mv % %.bak`,
    language: "bash",
  },
  {
    id: "snip-ch3-builtin-type",
    page: 96,
    section: "3.4.7",
    title: "区分 Shell 内置命令与外部程序",
    description: "使用 type 查看命令是内建命令（builtin）还是独立的可执行二进制程序，或者别名。",
    code: `[ict@openEuler24 ~]$ type cd cat ls`,
    language: "bash",
  },
  {
    id: "snip-ch3-function-decl",
    page: 96,
    section: "3.4.7",
    title: "定义 Bash 函数",
    description: "在 Shell 环境中定义自定义 install-help 函数，将 dnf 帮助包的动态安装逻辑进行封装。",
    code: `function install-help() {
    dnf install -y \`rpm -qf \\\`which dnf\\\` | sed 's/-[0-9].*//'\`-help
}`,
    language: "bash",
  },
  {
    id: "snip-ch3-function-source",
    page: 96,
    section: "3.4.7",
    title: "载入并测试自定义函数",
    description: "使用 source 或 . 命令导入自定义的 rc 配置文件，然后用 type 查看函数是否生效。",
    code: `[ict@openEuler24 ~]$ . ~/.install-help.rc && type install-help
install-help is a function`,
    language: "bash",
  },
  /* ══════ Ch4: OS Principles and Practice ══════ */
  {
    id: "snip-file-tree",
    page: 115,
    section: "4.2.4",
    title: "Linux 文件树操作",
    description: "使用 mkdir 创建目录、cp 复制文件、mv 移动文件，构建文件树。",
    code: `# 建立实验目录结构
mkdir -p ~/linux-lab/files
cd ~/linux-lab/files

# 创建并复制文件
touch note.txt
cp note.txt note.bak

# 查看文件树
find . -type f`,
    language: "bash",
  },
  {
    id: "snip-ch4-ln",
    page: 120,
    section: "4.3",
    title: "文件链接",
    description: "理解硬链接与符号链接（软链接）的区别与用法。",
    code: `# 创建硬链接（共享同一 inode）
ln original.txt hardlink.txt

# 创建符号链接（快捷方式）
ln -s /path/to/target symlink

# 查看链接
ls -li`,
    language: "bash",
  },
  {
    id: "snip-process-ps",
    page: 135,
    section: "4.4.7",
    title: "进程查看与过滤",
    description: "使用 ps、top 查看进程，配合 grep/kill 过滤和终止进程。",
    code: `# 启动后台进程
sleep 300 &

# 查看当前用户进程树
ps uf

# 过滤目标进程
ps aux | grep "[s]leep"

# 终止进程
kill %1`,
    language: "bash",
  },
  {
    id: "snip-ch4-top",
    page: 140,
    section: "4.4.8",
    title: "实时进程监控",
    description: "使用 top 和 htop 实时监控系统资源和进程状态。",
    code: `# 实时查看进程（按 q 退出）
top

# 按内存使用排序
top -o %MEM

# 查看特定用户的进程
top -u student`,
    language: "bash",
  },

  /* ══════ Ch5: openEuler Development Environment ══════ */
  {
    id: "snip-vim-basic",
    page: 148,
    section: "5.1.1",
    title: "Vim 基本编辑操作",
    description: "Vim 是 Linux 核心文本编辑器。掌握模式切换、编辑和保存。",
    code: `# 用 Vim 打开或创建文件
vim hello.c

# 进入插入模式后输入：
#include <stdio.h>
int main() {
    printf("Hello, openEuler!\\n");
    return 0;
}

# 按 Esc → :wq 保存退出
# 编译并运行
gcc hello.c -o hello && ./hello`,
    language: "bash",
  },
  {
    id: "snip-text-analysis",
    page: 153,
    section: "5.1.3",
    title: "grep、sort、uniq 文本分析",
    description: "组合 grep 过滤、sort 排序、uniq 统计，完成日志分析任务。",
    code: `# 创建样例日志
printf "INFO boot\\nERROR disk\\nWARN cpu\\nERROR net\\n" > access.log

# 筛选 ERROR 记录
grep ERROR access.log

# 统计各日志级别出现次数
cut -d ' ' -f1 access.log | sort | uniq -c`,
    language: "bash",
  },
  {
    id: "snip-for-loop",
    page: 157,
    section: "5.1.5",
    title: "循环批量处理",
    description: "使用 for/while 循环批量操作文件，Shell 自动化的核心技能。",
    code: `# 批量重命名文件
for file in *.txt; do
  mv "$file" "\${file%.txt}.bak"
done

# 批量查看文件大小
for f in /home/student/*; do
  echo "$f: $(wc -c < "$f") bytes"
done`,
    language: "bash",
  },
  {
    id: "snip-shell-script",
    page: 163,
    section: "5.2.1",
    title: "Shell 脚本编写与执行",
    description: "编写可执行脚本：shebang、变量、输入、条件判断的完整流程。",
    code: `# 创建脚本文件
cat > guess.sh << 'EOF'
#!/bin/sh
echo "=== Number Guessing Game ==="
echo -n "Guess a number (1-100): "
read num
echo "You guessed: $num"
EOF

# 添加执行权限并运行
chmod +x guess.sh
./guess.sh`,
    language: "bash",
  },
  {
    id: "snip-ch5-sed",
    page: 166,
    section: "5.2.3",
    title: "sed 流编辑器基础",
    description: "使用 sed 对文本进行查找替换、删除行等批量处理。",
    code: `# 替换文件中所有 old 为 new
sed 's/old/new/g' file.txt

# 删除空行
sed '/^$/d' file.txt

# 打印第 3 到第 5 行
sed -n '3,5p' file.txt`,
    language: "bash",
  },
  {
    id: "snip-ch5-awk",
    page: 170,
    section: "5.2.4",
    title: "awk 文本处理",
    description: "使用 awk 对结构化文本进行列提取和条件过滤。",
    code: `# 打印第 1 和第 3 列
awk '{print $1, $3}' data.txt

# 按条件过滤：第 2 列大于 50
awk '$2 > 50' data.txt

# 计算某列的总和
awk '{sum += $3} END {print sum}' data.txt`,
    language: "bash",
  },

  /* ══════ Ch6: Embedded OS Development ══════ */
  {
    id: "snip-gcc-compile",
    page: 208,
    section: "6.2.1",
    title: "GCC 编译 C 程序",
    description: "使用 GCC 编译链接 C 程序，理解预处理、编译、汇编、链接四阶段。",
    code: `# 单文件编译（带警告）
gcc -Wall -o program program.c

# 分步编译
gcc -Wall -c utils.c -o utils.o
gcc -Wall -c main.c -o main.o
gcc utils.o main.o -o app

# 查看编译产物类型并运行
file app && ./app`,
    language: "bash",
  },
  {
    id: "snip-ch6-make",
    page: 215,
    section: "6.2.3",
    title: "Makefile 自动化构建",
    description: "编写 Makefile 实现自动化编译，理解目标、依赖和规则。",
    code: `# 简单 Makefile 示例
cat > Makefile << 'EOF'
CC = gcc
CFLAGS = -Wall

app: main.o utils.o
\t$(CC) $(CFLAGS) -o app main.o utils.o

main.o: main.c
\t$(CC) $(CFLAGS) -c main.c

utils.o: utils.c
\t$(CC) $(CFLAGS) -c utils.c

clean:
\trm -f *.o app
EOF

# 构建
make && ./app`,
    language: "bash",
  },
  {
    id: "snip-ch6-gdb",
    page: 220,
    section: "6.3",
    title: "GDB 调试基础",
    description: "使用 GDB 设置断点、单步执行、查看变量值来调试程序。",
    code: `# 编译时加调试符号
gcc -g -o program program.c

# 启动 GDB
gdb ./program

# GDB 常用命令（在 GDB 内执行）：
# break main    - 在 main 函数设断点
# run           - 运行程序
# next          - 单步执行
# print var     - 查看变量值
# quit          - 退出`,
    language: "bash",
  },

  /* ══════ Ch7: Network Basics and Management ══════ */
  {
    id: "snip-ch7-ip",
    page: 240,
    section: "7.2",
    title: "查看网络配置",
    description: "使用 ip 命令查看网络接口、IP 地址和路由表。",
    code: `# 查看所有网络接口
ip addr show

# 查看路由表
ip route show

# 查看网络接口统计
ip -s link`,
    language: "bash",
  },
  {
    id: "snip-network-diag",
    page: 254,
    section: "7.3.5",
    title: "网络连通性诊断",
    description: "综合使用 ping、traceroute、curl 排查网络连通性问题。",
    code: `# 测试连通性
ping -c 3 127.0.0.1

# 查看数据包路径
traceroute www.example.com

# 测试 HTTP 服务
curl -I https://www.example.com

# 查看监听端口
ss -tlnp`,
    language: "bash",
  },
  {
    id: "snip-ch7-netstat",
    page: 260,
    section: "7.4",
    title: "查看网络连接状态",
    description: "使用 ss 和 netstat 查看当前系统的网络连接和监听端口。",
    code: `# 查看所有 TCP 连接
ss -t

# 查看监听中的端口
ss -tln

# 查看进程使用的端口
ss -tlnp`,
    language: "bash",
  },
  {
    id: "snip-ch7-ssh",
    page: 268,
    section: "7.5",
    title: "SSH 远程连接",
    description: "使用 SSH 安全连接到远程服务器，以及 scp 传输文件。",
    code: `# 远程登录
ssh user@remote-host

# 指定端口登录
ssh -p 2222 user@remote-host

# 使用密钥登录
ssh -i ~/.ssh/id_rsa user@remote-host

# 传输文件
scp local.file user@remote-host:/path/`,
    language: "bash",
  },

  /* ══════ Ch8: Server OS Management ══════ */
  {
    id: "snip-permission",
    page: 285,
    section: "8.2.1",
    title: "文件权限管理",
    description: "理解 rwx 权限体系，用 chmod 数字和符号模式管理文件访问。",
    code: `# 查看文件权限（含隐藏文件）
ls -la

# 数字模式：用户=rwx, 组=r, 其他人=r
chmod 744 script.sh

# 符号模式：给组添加写权限
chmod g+w script.sh

# 递归修改目录
chmod -R 755 ~/public_html/`,
    language: "bash",
  },
  {
    id: "snip-ch8-useradd",
    page: 290,
    section: "8.2.3",
    title: "用户与组管理",
    description: "创建用户、修改密码、管理组成员的基本操作。",
    code: `# 查看当前用户
whoami
id

# 查看所有用户
cat /etc/passwd

# 查看用户所属组
groups`,
    language: "bash",
  },
  {
    id: "snip-ch8-systemctl",
    page: 300,
    section: "8.3",
    title: "systemd 服务管理",
    description: "使用 systemctl 查看和管理系统服务状态。",
    code: `# 查看所有服务状态
systemctl list-units --type=service

# 查看特定服务状态
systemctl status sshd

# 启动/停止/重启服务（需要 root）
sudo systemctl start nginx
sudo systemctl enable nginx`,
    language: "bash",
  },
  {
    id: "snip-ch8-journal",
    page: 308,
    section: "8.4",
    title: "日志查看与分析",
    description: "使用 journalctl 和 tail 查看系统和服务日志。",
    code: `# 查看系统日志
journalctl -n 50

# 查看特定服务的日志
journalctl -u nginx

# 实时跟踪日志
tail -f /var/log/syslog

# 搜索日志中的错误
grep -i error /var/log/syslog`,
    language: "bash",
  },

  /* ══════ Ch9: Open-Source Innovation ══════ */
  {
    id: "snip-ch9-git",
    page: 340,
    section: "9.2",
    title: "Git 版本控制基础",
    description: "使用 Git 进行代码版本管理：初始化仓库、提交、查看历史。",
    code: `# 初始化仓库
git init

# 配置用户信息
git config user.name "Student"
git config user.email "student@example.com"

# 添加文件并提交
git add .
git commit -m "Initial commit"

# 查看提交历史
git log --oneline`,
    language: "bash",
  },
  {
    id: "snip-ch9-git-branch",
    page: 348,
    section: "9.3",
    title: "Git 分支与合并",
    description: "创建分支、切换分支、合并修改的完整工作流。",
    code: `# 创建并切换到新分支
git checkout -b feature-branch

# 进行修改后提交
echo "new feature" >> README.md
git add README.md
git commit -m "Add new feature"

# 切回主分支并合并
git checkout main
git merge feature-branch`,
    language: "bash",
  },
  {
    id: "snip-ch9-container",
    page: 355,
    section: "9.5",
    title: "Docker 容器入门",
    description: "使用 Docker 拉取镜像、运行容器、查看容器状态。",
    code: `# 拉取镜像
docker pull ubuntu:24.04

# 运行容器
docker run -it --name my-lab ubuntu:24.04 bash

# 查看运行中的容器
docker ps

# 查看所有容器（含已停止）
docker ps -a`,
    language: "bash",
  },
];

/** 返回指定页码 ±5 范围内的代码片段 */
export function snippetsForPage(page: number): TextbookSnippet[] {
  return textbookSnippets.filter((s) => Math.abs(s.page - page) <= 5);
}

/** 按 ID 查找单个代码片段 */
export function getSnippetById(id: string | null | undefined): TextbookSnippet | null {
  if (!id) return null;
  return textbookSnippets.find((s) => s.id === id) ?? null;
}
