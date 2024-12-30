项目 jupyter-coreseek-kanban 是一个工作在 jupyter 中的插件，类似其 markdown file editor 插件。不同之处在于，显示的不是文本编辑器，而是看板。

规格：

1. 系统预制的任务状态有：
backlog | todo | doing | review | done
2. kanban 存储 任务数据到 jupyter content 目录的根目录下的 `__worklog__/tasks.md` 中
3. 使用 markdone 文件
头部的 meta section 标识当前的 markdown 用于 kanban ( 当前插件 / jupyter 的看板插件）
    - 可以考虑引入新的 mime ,  eg. text/markdown-kanban 
   - 在 meta section 中声明这个 mime
4. markdown 的 level -1 head 用于 WorkStage 的名称
   - 实际是流水线上的工序， eg. AI Agent 完成代码后，它的 Done Task 就自动编成 人类 Verify 的任务的 Backlog ， 当然，实际过程中 Verify 的任务也可能是 AI 
5. markdown 的 level -2 head 用于任务的 category ， eg. backlog | todo| ...
6. markdown 的 level -3/4 head 用于具体任务

用法：

1. 用户可以通过左侧的侧面板 Task， 直接打开 kanban 管理界面
2. 用户可以在文件管理器中打开 `__worklog__/features.md` 打开 kanban 管理界面（考虑到 . 开头的目录不显示，这个功能很难触发）
   - 在后面的实践中，发现 仅提供 features.md 是不对的， features.md 应该是泛指一类 .md 文件。
3. 在 kanban 界面中，用户可以
   - 创建新的 task category
   - 创建新的 task

概念说明：

- features 是一组 task 的集合，是 kanban 的一个分组
- task 可以包括一级的 subtask，表现为 level-4 head ( task 默认为 level-3 head)
- task 在处理过程中，可以存在多个不同的 stage ，表现为 level-2 head

   - Backlog 

程序员视角

1. 增加 features / task 管理的 token 和 对应的接口
2. 其他组件可以订阅任务状态变化
     - 某个任务的状态变化
     - 某个 category 任务的进入、移出


# Task 的文本描述形式

1. 采用基于 plain text 的 markdown 格式
2. Markdown 的 level -1 head 用于
   - WorkStage 的名称，标记 完成工作所需要的各阶段
   - 第一个 level-1 head 之前的文本为 完成当前诸多任务的整体背景和约束。
3. Markdown 的 level -2 head 用于
   - Task 的 category
4. Markdown 的 level -3/4 head 用于
   - Task 的标题
5. Task 的描述出现在两部分
   - 当前 标题下面的部分，用于描述任务的背景和约束，也用于存储 Task 的 Tag
   - 指向任务详情的文件链接，用于描述任务的细节
      - 详情文件为 markdown 格式
      - 详情文件的位置为 feature 文件名的 basename + '.files'
      - 详情文件目录中的详情文件不不区分任务所在的 Stage 和 具体状态 / Category
   - 并不是每个任务都需要有详情文件，也可以只有一个简单的描述
6. 所有的 Task 的 title 均会出现在 markdown 的描述区域（文件开始到第一个 head 之前）中
   - 表现为 Markdown 的 TODO 列表，用于记录任务的状态
      - 当任务完成时，标记 `[x]`
      - 当任务未启动或进行中时，标记 `[ ]`
   - 每个任务具有唯一编号，编码规则为 `{task_prefix}-{task_id}`
   - 用户通过图形界面管理任务时，无法修改 task_id , 因此可以使用 task_id 唯一标识任务
   - task_id 可以使用任何符合规范的字符串，但是建议使用 顺序编号

Model 通过 接口函数 完成 默认 Task 文件的构建
   
   - 调用接口函数时传递的文本，可以用于 i18n ， 便于在多语种的环境中使用
   - 传递关键文本参数时，需要同时传递 翻译后的文本 和 原始文本 
      - 存在一种实现是，将翻译后的文本作为补充说明放在 head 后面
   
   需要实现的接口

   - createFeatureFile
      - 参数
         - title / file_name
         - task_prefix : 用于任务编码的前缀
         - description
      - 返回值
         - 成功 | 文件已经存在 | 创建失败
   - addTaskStage
      - 说明：
         - feature 文件 默认构造 | 新建时，有 Backlog | In Progress | Review | Done
      - 参数
         - name 
         - name_i18n
      - 返回值
         - 成功 | 已经存在
   - addTaskCategory 
      说明：
         默认的 Category 构造后，包括
         - Todo
         - In Progress
         - Done
      - 参数：
         - stage_name     目标 stage
         - name
         - name_i18n
      - 返回值
         - 成功 | 已经存在
   - addTask
      - 参数
         - name
         - description
      - 返回值
         - task_id
      注意：需要修改两个地方，主描述区域的 task_list，用于构造 task_id
           添加 task 到 Backlog Stage. 
   - moveTask
      - 参数
         - task_id
         - to_stage_name
         - to_category_name
      - 返回值
         - 成功 | 失败_task_id不存在 | 失败_stage不存在 | 失败_category不存在
   - updateTaskDetails
      - 说明
         - 该函数需要额外增加可以操作 Content | 文件系统的接口对象
      - 参数
         - task_id
         - context: 任务关联的详细信息，记录在外部文件中，文件名为 `{feature_basename}.files/{task_id}.md`
      - 返回值
         - 成功 | 失败_task_id不存在
   - getTaskDetails
      - 说明
         - 该函数需要额外增加可以操作 Content | 文件系统的接口对象
      - 参数
         - task_id
         - default_context
      - 返回值
         - task_details | default_context
   - updateTaskTags
      - 参数
         - task_id
         - tags
      - 返回值
         - 成功 | 失败_task_id不存在
   - getTaskTags
      - 参数
         - task_id
      - 返回值
         - tags
   - deleteTask
      - 参数
         - task_id
      - 返回值
         - 成功 | 失败_task_id不存在
   - deleteTaskCategory
      - 参数
         - category_name
         - take_over_category , 如果 有存在的 task 会自动分配到 take_over_category
      - 返回值
         - 成功 | 失败_category_name不存在
   - deleteTaskStage
      - 参数
         - stage_name // 如果 有存在的 task , 会自动回到 Backlog，如果没有 Backlog, 会成为 uncategorized task，即 从文件开头到当前任务的 head，中间没有 stage ( level-1 head )
      - 返回值
         - 成功 | 失败_stage_name不存在
   - listTasks
      - 参数
         - stage_name   可选
         - category_name 可选
      - 返回值
         - tasks
   - listStages
      - 返回值
         - stages name
   - listCategories
      - 参数
         - stage_name
      - 返回值
         - categories
   - listUncategorizedTasks
      - 返回值
         - tasks   
   - loadFeatureFile
      - 说明
         - 该函数需要额外增加可以操作 Content | 文件系统的接口对象
      - 参数
         - feature_name
      - 返回值
         - 成功 | 文件不存在 | 加载失败
   - saveFeatureFile
      - 说明
         - 该函数需要额外增加可以操作 Content | 文件系统的接口对象
      - 参数
         - feature_name
         - content
      - 返回值
         - 成功 | 保存失败
   - loadFeature
      - 参数
         - content
      - 返回值
         - 成功，此时 model 为更新过的模型 | 加载失败
   - dumpFeature
      - 返回值
         - content

# 界面原型

1. 界面整体分二部分

   - 右边部分，类似 Running Terminals And Kernels
      - 顶部为工具栏，最右侧为按钮 ...
      - 点击按钮 '...' 弹出菜单

2. Task 表现为 Card 的形态

   - Task 已经通过的 Stage 会自动增加 Tag 
   - Task 可以在 Stage 中的 Category 中进行自由移动
      - 软件层面不限定 Task 的处理流程
      - 可选的提供 `{feature_name}.files/ChangeLog` 文件，用于存储 Task 的变更记录
      - 要支持此功能，需要额外增加 Content | 文件系统 的接口对象 在 Model 对象中。因此暂不考虑。
