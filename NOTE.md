Me

项目 kanban 是一个工作在 jupyter 中的插件，类似其 markdown file editor 插件。不同之处在于，显示的不是文本编辑器，而是看板。

规格：

1. 系统预制的任务状态有：
backlog | todo | doing | review | done
2. kanban 存储 任务数据到 jupyter content 目录的根目录下的 .worklog/tasks.md 中
3. 使用 markdone 文件头部的 meta section 标识当前的 markdown 用于 kanban ( 当前插件 / jupyter 的看板插件）
    - 可以考虑引入新的 mime ,  eg. text/markdown-kanban 
   - 在 meta section 中声明这个 mime
4. markdown 的 level -1 head 用于任务的 category ， eg. backlog | todo| ...
5. markdown 的 level -2/3/4 head 用于具体任务

用法：

1. 用户可以通过左侧的侧面板 Task ， 直接打开 kanban 管理界面
2. 用户可以在文件管理器中打开 .worklog/tasks.md 打开 kanban 管理界面（考虑到 . 开头的目录不显示，这个功能很难触发）
3. 在 kanban 界面中，用户可以
   - 创建新的 task category
   - 创建新的 task

程序员视角

1. 增加 task 管理的 token 和 对应的接口
2. 其他组件可以订阅任务状态变化
     - 某个任务的状态变化
     - 某个 category 任务的进入、移出